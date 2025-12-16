# @Author: carlosgilgonzalez
# @Date:   2019-10-15T16:13:47+01:00
# @Last modified by:   carlosgilgonzalez
# @Last modified time: 2019-10-15T16:56:27+01:00


# Original work:
# Adafruit PN532 NFC/RFID control library.
# Author: Tony DiCola

# Partial Port to Micropython:
# Micropython PN532 NFC/RFID control library.
# Author: Carlos Gil Gonzalez
"""
Micropython PN532 NFC/RFID control library (SPI)
https://github.com/Carglglz/NFC_PN532_SPI
"""

import time
from machine import Pin
from micropython import const
from config import _DEBUG_NFC as _DEBUG

# __version__ = "0.0.0-auto.0"
# __repo__ = "https://github.com/adafruit/Adafruit_CircuitPython_PN532.git"

# pylint: disable=bad-whitespace
_PREAMBLE = const(0x00)
_STARTCODE1 = const(0x00)
_STARTCODE2 = const(0xFF)
_POSTAMBLE = const(0x00)

_HOSTTOPN532 = const(0xD4)
_PN532TOHOST = const(0xD5)

# PN532 Commands
_COMMAND_DIAGNOSE = const(0x00)
_COMMAND_GETFIRMWAREVERSION = const(0x02)
_COMMAND_GETGENERALSTATUS = const(0x04)
_COMMAND_SETSERIALBAUDRATE = const(0x10)
_COMMAND_SETPARAMETERS = const(0x12)
_COMMAND_SAMCONFIGURATION = const(0x14)

_COMMAND_INLISTPASSIVETARGET = const(0x4A)

_COMMAND_INDATAEXCHANGE = const(0x40)
_COMMAND_INCOMMUNICATETHRU = const(0x42)


_RESPONSE_INDATAEXCHANGE = const(0x41)
_RESPONSE_INLISTPASSIVETARGET = const(0x4B)

_WAKEUP = const(0x55)

_MIFARE_ISO14443A = const(0x00)

# Mifare Commands
MIFARE_CMD_AUTH_A = const(0x60)
MIFARE_CMD_AUTH_B = const(0x61)
MIFARE_CMD_READ = const(0x30)
MIFARE_CMD_WRITE = const(0xA0)
MIFARE_ULTRALIGHT_CMD_WRITE = const(0xA2)

# Known keys
KEY_DEFAULT_B = bytes([0xFF]*6)


_ACK = b'\x00\x00\xFF\x00\xFF\x00'
_FRAME_START = b'\x00\x00\xFF'
# pylint: enable=bad-whitespace
_SPI_STATREAD = const(0x02)
_SPI_DATAWRITE = const(0x01)
_SPI_DATAREAD = const(0x03)
_SPI_READY = const(0x01)


def _reset(pin):
    """Perform a hardware reset toggle"""
    pin.init(Pin.OUT)
    pin.value(True)
    time.sleep(0.1)
    pin.value(False)
    time.sleep(0.5)
    pin.value(True)
    time.sleep(0.1)


class BusyError(Exception):
    """Base class for exceptions in this module."""
    pass


def reverse_bit(num):
    """Turn an LSB byte to an MSB byte, and vice versa. Used for SPI as
    it is LSB for the PN532, but 99% of SPI implementations are MSB only!"""
    result = 0
    for _ in range(8):
        result <<= 1
        result += (num & 1)
        num >>= 1
    return result


class PN532:
    """Driver for the PN532 connected over SPI. Pass in a hardware or bitbang
    SPI device & chip select digitalInOut pin. Optional IRQ pin (not used),
    reset pin and debugging output."""

    def __init__(self, spi, cs_pin, irq=None, reset=None):
        """Create an instance of the PN532 class using SPI"""
        self._irq = irq
        self.CSB = cs_pin
        self._spi = spi
        self.CSB.on()
        if reset:
            if _DEBUG: print("[PN532] Resetting")
            _reset(reset)
        try:
            self._wakeup()
            # self.get_firmware_version()  # first time often fails, try 2ce
            return
        except (BusyError, RuntimeError):
            pass
        # self.get_firmware_version()
    
    
    # -----------------------------------------
    # FAST ROUTINEN, DAMIT AUDIO NICHT RUCKELT
    # -----------------------------------------
    def _read_data_fast(self, count):
        """
        Schnelles Lesen von count Bytes:
        - Keine time.sleep(..)
        - Nur eine SPI-Transaktion.
        - Nutzt denselben Rahmen wie _read_data, aber ohne künstliche Delays.
        """
        frame = bytearray(count + 1)
        frame[0] = reverse_bit(_SPI_DATAREAD)
        self.CSB.off()
        self._spi.write_readinto(frame, frame)
        self.CSB.on()
        for i, val in enumerate(frame):
            frame[i] = reverse_bit(val)
        return frame[1:]  # Statusbyte verwerfen

    def _write_data_fast(self, framebytes):
        """
        Schnelles Schreiben eines Frames:
        - Keine Sleeps, minimaler Overhead.
        """
        rev_frame = bytearray(len(framebytes) + 1)
        rev_frame[0] = reverse_bit(_SPI_DATAWRITE)
        for i, b in enumerate(framebytes, start=1):
            rev_frame[i] = reverse_bit(b)
        self.CSB.off()
        self._spi.write(rev_frame)
        self.CSB.on()

    def _write_frame_fast(self, data):
        """
        Schnelles Senden eines kompletten PN532-Frames (wie _write_frame),
        aber via _write_data_fast().
        """
        assert data is not None and 1 < len(data) < 255, 'Data must be array of 1 to 255 bytes.'
        length = len(data)
        frame = bytearray(length + 8)
        frame[0] = _PREAMBLE
        frame[1] = _STARTCODE1
        frame[2] = _STARTCODE2
        checksum = 0
        frame[3] = length & 0xFF
        frame[4] = (~length + 1) & 0xFF
        frame[5:-2] = data
        checksum = (checksum + frame[3] + frame[4] + sum(data)) & 0xFF
        frame[-2] = (~checksum + 1) & 0xFF
        frame[-1] = _POSTAMBLE
        self._write_data_fast(frame)

    def _read_frame_fast(self, length):
        """
        Schnelles Lesen eines Antwort-Frames (wie _read_frame),
        aber mit _read_data_fast(), d.h. ohne Delays.
        """
        response = self._read_data_fast(length + 8)
        
        # Rest wie in _read_frame:
        offset = 0
        while response[offset] == 0x00:
            offset += 1
            if offset >= len(response):
                raise RuntimeError('Response frame preamble does not contain 0x00FF!')
        if response[offset] != 0xFF:
            raise RuntimeError('Response frame preamble does not contain 0x00FF!')
        offset += 1
        if offset >= len(response):
            raise RuntimeError('Response contains no data!')
        frame_len = response[offset]
        if (frame_len + response[offset + 1]) & 0xFF != 0:
            raise RuntimeError('Response length checksum did not match expected value!')
        offset += 2
        if offset + frame_len >= len(response):
            raise RuntimeError('Response does not contain that many data bytes!')
        checksum = sum(response[offset:offset + frame_len + 1]) & 0xFF
        if checksum != 0:
            raise RuntimeError('Response checksum did not match expected value!')
        return response[offset + 2:offset + 2 + frame_len]
    
    def call_function_fast(self, command, response_length=0, params=[]):
        """
        Schneller Funktionsaufruf:
        - Kein langes Busy-Wait mit time.sleep(0.02).
        - Wenn PN532 nicht sehr schnell reagiert, gibt es None zurück
          (= keine Information).
        """
        # Frame-Daten bauen (TFI + Command + Params)
        data = bytearray(2 + len(params))
        data[0] = _HOSTTOPN532
        data[1] = command & 0xFF
        for i, val in enumerate(params):
            data[2 + i] = val
        
        # Frame senden
        self._write_frame_fast(data)
        
        # Max. ~2 ms auf ACK warten
        deadline = time.ticks_add(time.ticks_ms(), 2)
        while not self._status_ready_once():
            if time.ticks_diff(time.ticks_ms(), deadline) >= 0:
                return None
            time.sleep_us(100)
        
        ack = self._read_data_fast(len(_ACK))
        if ack != _ACK:
            return None
        
        # Nochmal kurz auf Antwort warten
        deadline = time.ticks_add(time.ticks_ms(), 2)
        while not self._status_ready_once():
            if time.ticks_diff(time.ticks_ms(), deadline) >= 0:
                return None
            time.sleep_us(100)
        
        # Antwort lesen
        response = self._read_frame_fast(response_length + 2)
        if not (response[0] == _PN532TOHOST and response[1] == (command + 1)):
            return None
        
        return response[2:]
    
    def check_passive_target_fast(self, card_baud=_MIFARE_ISO14443A):
        """
        Sehr schneller Check, ob ein passiver Tag auf der Antenne liegt.

        Rückgabe:
        - True  -> mindestens 1 Target gefunden
        - False -> PN532 antwortet explizit mit 0 Targets
        - None  -> keine Information (Timeout / nicht bereit / Fehler)
        """
        try:
            response = self.call_function_fast(
                _COMMAND_INLISTPASSIVETARGET,
                params=[0x01, card_baud],
                response_length=19
            )
        except Exception as e:
            if _DEBUG: print("[PN532] check_passive_target_fast exception:", e)
            return None
        
        if response is None:
            # keine gültige Antwort -> keine Info
            return None
        
        if len(response) < 1:
            return False
        
        num_targets = response[0]
        if num_targets == 0:
            return False
        return True
    
    # -----------------------------------------
    # NORMALE LOW LEVEL FUNKTIONEN
    # -----------------------------------------
    def _status_ready_once(self):
        """
        Schneller Status-Check:
        - Sendet genau *eine* STATREAD-Transaktion über SPI.
        - Keine Sleeps, kein Loop.
        - Liefert True, wenn PN532 nicht busy ist (Statusbit 0x01).
        """
        status_query = bytearray([reverse_bit(_SPI_STATREAD), 0])
        status = bytearray(2)
        self.CSB.off()
        self._spi.write_readinto(status_query, status)
        self.CSB.on()
        return reverse_bit(status[1]) == 0x01
    
    def _wakeup(self):
        """Send any special commands/data to wake up PN532"""
        time.sleep(1)
        self.CSB.off()
        time.sleep_ms(2)
        self._spi.write(bytearray([0x00]))
        time.sleep_ms(2)
        self.CSB.on()  # pylint: disable=no-member
        time.sleep(1)
    
    def _wait_ready(self, timeout=1000):
        """Poll PN532 if status byte is ready, up to `timeout` milliseconds"""
        status_query = bytearray([reverse_bit(_SPI_STATREAD), 0])
        status = bytearray([0, 0])
        timestamp = time.ticks_ms()
        while time.ticks_diff(time.ticks_ms(), timestamp) < timeout:
            time.sleep(0.02)   # required
            self.CSB.off()
            time.sleep_ms(2)
            self._spi.write_readinto(status_query, status)
            time.sleep_ms(2)
            self.CSB.on()
            if reverse_bit(status[1]) == 0x01:  # LSB data is read in MSB
                return True      # Not busy anymore!
            else:
                time.sleep(0.01)  # pause a bit till we ask again
        # Timed out!
        return False
    
    def _read_data(self, count):
        """Read a specified count of bytes from the PN532."""
        # Build a read request frame.
        frame = bytearray(count+1)
        # Add the SPI data read signal byte, but LSB'ify it
        frame[0] = reverse_bit(_SPI_DATAREAD)
        time.sleep(0.02)   # required
        self.CSB.off()
        time.sleep_ms(2)
        self._spi.write_readinto(frame, frame)
        time.sleep_ms(2)
        self.CSB.on()
        for i, val in enumerate(frame):
            frame[i] = reverse_bit(val)  # turn LSB data to MSB
        if _DEBUG: print("[PN532] _read_data: ", [hex(i) for i in frame[1:]])
        return frame[1:]   # don't return the status byte
    
    def _write_data(self, framebytes):
        """Write a specified count of bytes to the PN532"""
        # start by making a frame with data write in front,
        # then rest of bytes, and LSBify it
        rev_frame = [reverse_bit(x)
                     for x in bytes([_SPI_DATAWRITE]) + framebytes]
        if _DEBUG: print("[PN532] _write_data: ", [hex(i) for i in rev_frame])
        time.sleep(0.02)   # required
        self.CSB.off()
        time.sleep_ms(2)
        self._spi.write(bytes(rev_frame))  # pylint: disable=no-member
        time.sleep_ms(2)
        self.CSB.on()
    
    def _write_frame(self, data):
        """Write a frame to the PN532 with the specified data bytearray."""
        assert data is not None and 1 < len(
            data) < 255, 'Data must be array of 1 to 255 bytes.'
        # Build frame to send as:
        # - Preamble (0x00)
        # - Start code  (0x00, 0xFF)
        # - Command length (1 byte)
        # - Command length checksum
        # - Command bytes
        # - Checksum
        # - Postamble (0x00)
        length = len(data)
        frame = bytearray(length+8)
        frame[0] = _PREAMBLE
        frame[1] = _STARTCODE1
        frame[2] = _STARTCODE2
        checksum = sum(frame[0:3])
        frame[3] = length & 0xFF
        frame[4] = (~length + 1) & 0xFF
        frame[5:-2] = data
        checksum += sum(data)
        frame[-2] = ~checksum & 0xFF
        frame[-1] = _POSTAMBLE
        # Send frame.
        if _DEBUG: print('[PN532] _write_frame: ', [hex(i) for i in frame])
        self._write_data(bytes(frame))
    
    def _read_frame(self, length):
        """Read a response frame from the PN532 of at most length bytes in size.
        Returns the data inside the frame if found, otherwise raises an exception
        if there is an error parsing the frame.  Note that less than length bytes
        might be returned!
        """
        # Read frame with expected length of data.
        response = self._read_data(length+8)
        if _DEBUG: print('[PN532] _read_frame:', [hex(i) for i in response])
        
        # Swallow all the 0x00 values that preceed 0xFF.
        offset = 0
        while response[offset] == 0x00:
            offset += 1
            if offset >= len(response):
                raise RuntimeError(
                    'Response frame preamble does not contain 0x00FF!')
        if response[offset] != 0xFF:
            raise RuntimeError(
                'Response frame preamble does not contain 0x00FF!')
        offset += 1
        if offset >= len(response):
            raise RuntimeError('Response contains no data!')
        # Check length & length checksum match.
        frame_len = response[offset]
        if (frame_len + response[offset+1]) & 0xFF != 0:
            raise RuntimeError(
                'Response length checksum did not match length!')
        # Check frame checksum value matches bytes.
        checksum = sum(response[offset+2:offset+2+frame_len+1]) & 0xFF
        if checksum != 0:
            raise RuntimeError(
                'Response checksum did not match expected value: ', checksum)
        # Return frame data.
        return response[offset+2:offset+2+frame_len]
    
    # -----------------------------------------
    # HIGH LEVEL INTERFACE
    # -----------------------------------------
    def call_function(self, command, response_length=0, params=[], timeout=1000):  # pylint: disable=dangerous-default-value
        """Send specified command to the PN532 and expect up to response_length
        bytes back in a response.  Note that less than the expected bytes might
        be returned!  Params can optionally specify an array of bytes to send as
        parameters to the function call.  Will wait up to timeout seconds
        for a response and return a bytearray of response bytes, or None if no
        response is available within the timeout.
        """
        # Build frame data with command and parameters.
        data = bytearray(2+len(params))
        data[0] = _HOSTTOPN532
        data[1] = command & 0xFF
        for i, val in enumerate(params):
            data[2+i] = val
        # Send frame and wait for response.
        try:
            self._write_frame(data)
        except OSError:
            self._wakeup()
            return None
        if not self._wait_ready(timeout):
            if _DEBUG: print('[PN532] _wait_ready timed out waiting for ACK')
            return None
        # Verify ACK response and wait to be ready for function response.
        if not _ACK == self._read_data(len(_ACK)):
            raise RuntimeError('Did not receive expected ACK from PN532!')
        if not self._wait_ready(timeout):
            if _DEBUG: print('[PN532] _wait_ready timed out waiting for response')
            return None
        # Read response bytes.
        response = self._read_frame(response_length+2)
        if _DEBUG: print('[PN532] call_function response:', [hex(i) for i in response])
        # Check that response is for the called function.
        if not (response[0] == _PN532TOHOST and response[1] == (command+1)):
            raise RuntimeError('Received unexpected command response!')
        # Return response data.
        return response[2:]
    
    def get_firmware_version(self):
        """Call PN532 GetFirmwareVersion function and return a tuple with the IC,
        Ver, Rev, and Support values.
        """
        response = self.call_function(
            _COMMAND_GETFIRMWAREVERSION, 4, timeout=500)
        if response is None:
            raise RuntimeError('Failed to detect the PN532')
        return tuple(response)
    
    def SAM_configuration(self):   # pylint: disable=invalid-name
        """Configure the PN532 to read MiFare cards."""
        # Send SAM configuration command with configuration for:
        # - 0x01, normal mode
        # - 0x14, timeout 50ms * 20 = 1 second
        # - 0x01, use IRQ pin
        # Note that no other verification is necessary as call_function will
        # check the command was executed as expected.
        self.call_function(_COMMAND_SAMCONFIGURATION,
                           params=[0x01, 0x14, 0x01])
    
    def read_passive_target(self, card_baud=_MIFARE_ISO14443A, timeout=1000):
        """Wait for a MiFare card to be available and return its UID when found.
        Will wait up to timeout seconds and return None if no card is found,
        otherwise a bytearray with the UID of the found card is returned.
        """
        # Send passive read command for 1 card.  Expect at most a 7 byte UUID.
        try:
            response = self.call_function(_COMMAND_INLISTPASSIVETARGET,
                                          params=[0x01, card_baud],
                                          response_length=19,
                                          timeout=timeout)
        except BusyError:
            return None  # no card found!
        # If no response is available return None to indicate no card is present.
        if response is None:
            return None
        # Check only 1 card with up to a 7 byte UID is present.
        if response[0] != 0x01:
            raise RuntimeError('More than one card detected!')
        if response[5] > 7:
            raise RuntimeError('Found card with unexpectedly long UID!')
        # Return UID of card.
        return response[6:6+response[5]]
    
    def ntag2xx_write_block(self, block_number, data):
        """Write a block of data to the card.  Block number should be the block
        to write and data should be a byte array of length 4 with the data to
        write.  If the data is successfully written then True is returned,
        otherwise False is returned.
        """
        assert data is not None and len(
            data) == 4, 'Data must be an array of 4 bytes!'
        # Build parameters for InDataExchange command to do NTAG203 classic write.
        params = bytearray(3+len(data))
        params[0] = 0x01  # Max card numbers
        params[1] = MIFARE_ULTRALIGHT_CMD_WRITE
        params[2] = block_number & 0xFF
        params[3:] = data
        # Send InDataExchange request.
        response = self.call_function(_COMMAND_INDATAEXCHANGE,
                                      params=params,
                                      response_length=1)
        return response[0] == 0x00
    
    def ntag2xx_read_block(self, block_number):
        """Read a block of data from the card.  Block number should be the block
        to read.  If the block is successfully read a bytearray of length 16 with
        data starting at the specified block will be returned.  If the block is
        not read then None will be returned.
        """
        return self.mifare_classic_read_block(block_number)[0:4]  # only 4 bytes per page
    
    def mifare_classic_read_block(self, block_number):
        """Read a block of data from the card.  Block number should be the block
        to read.  If the block is successfully read a bytearray of length 16 with
        data starting at the specified block will be returned.  If the block is
        not read then None will be returned.
        """
        # Send InDataExchange request to read block of MiFare data.
        response = self.call_function(_COMMAND_INDATAEXCHANGE,
                                      params=[0x01, MIFARE_CMD_READ,
                                              block_number & 0xFF],
                                      response_length=17)
        # Check first response is 0x00 to show success.
        if response[0] != 0x00:
            return None
        # Return first 4 bytes since 16 bytes are always returned.
        return response[1:]
    
    def mifare_classic_authenticate_block(self, uid, block_number, key_number=MIFARE_CMD_AUTH_B, key=KEY_DEFAULT_B):  # pylint: disable=invalid-name
        """Authenticate specified block number for a MiFare classic card.  Uid
        should be a byte array with the UID of the card, block number should be
        the block to authenticate, key number should be the key type (like
        MIFARE_CMD_AUTH_A or MIFARE_CMD_AUTH_B), and key should be a byte array
        with the key data.  Returns True if the block was authenticated, or False
        if not authenticated.
        """
        # Build parameters for InDataExchange command to authenticate MiFare card.
        uidlen = len(uid)
        keylen = len(key)
        params = bytearray(3 + uidlen + keylen)
        params[0] = 0x01  # Max card numbers
        params[1] = key_number & 0xFF
        params[2] = block_number & 0xFF
        params[3 : 3 + keylen] = key
        params[3 + keylen :] = uid
        # Send InDataExchange request and verify response is 0x00.
        response = self.call_function(
            _COMMAND_INDATAEXCHANGE, params=params, response_length=1
        )
        return response[0] == 0x00
