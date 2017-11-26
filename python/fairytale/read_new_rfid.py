#!/usr/bin/env python
#
# Concrete display implementation using Nokia5110
#
#

import sys
import time
import serial
import config

appDebug = True

class RFIDReader():
    serialInterfaceDevice = "/dev/ttyAMA0"
    serialInterfaceDeviceBaud = 9600

    # represents one RFID Tag
    rfidTag = ""
    ID = ""
    tagID = ""
    Characters = 0

    Checksum = 0
    #__Checksum_Tag = 0
    PreTag = 0

    # Flags
    Startflag = "\x02"
    Endflag = "\x03"

    rfidTagData = {}
    rfidAllTagsData = {}
    rfidAllTagsJsonData = {}
    allReadTags = []

    storagePath = "/home/pi/rfidTagData/"
    jsonFileExtension = "json"
    rfidJsonDataFile = ""

    try:
        UART = serial.Serial(serialInterfaceDevice, serialInterfaceDeviceBaud)
    except FileNotFoundError:
        print("ERROR :: could not open serial device")
    except Exception:
        print("ERROR :: could not open serial device")


    def __init__(self):
        """Initialize all the things"""

        # UART oeffnen
        try:
            self.UART.close()
            self.UART.open()
        except FileNotFoundError:
            print("ERROR :: could not open serial device")
        except Exception:
            print("ERROR :: could not open serial device")

        # setup signal handlers. SIGINT for KeyboardInterrupt
        # and SIGTERM for when running from supervisord
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

        self.status_light = StatusLight(config.status_light_pin)
        thread = Thread(target=self.status_light.start)
        thread.start()



    def run(self):
        # Zeichen einlesen
        Zeichen = self.UART.read()

        # Uebertragungsstart signalisiert worden?
        if Zeichen == self.Startflag:
            # ID zusammen setzen
            for Counter in range(13):
                Zeichen = self.UART.read()
                self.ID = self.ID + str(Zeichen)

            # Endflag aus dem String loeschen
            self.ID = self.ID.replace(self.Endflag, "" )

            # Checksumme berechnen
            for I in range(0, 9, 2):
                self.Checksum ^= ((int(self.ID[I], 16)) << 4) + int(self.ID[I + 1], 16)
            self.Checksum = hex(self.Checksum)

            # Tag herausfiltern
            self.PreTag = ((int(self.ID[1], 16)) << 8) + ((int(self.ID[2], 16)) << 4) + ((int(self.ID[3], 16)) << 0)
            self.PreTag = hex(self.PreTag)
            self.tagID = self.ID[4:10]

            self.rfidTagData['TagId'] = self.tagID
            self.rfidTagData['PreTag'] = self.PreTag
            self.rfidTagData['Checksum'] = self.Checksum
            self.rfidTagData['RawData'] = self.ID

        # now check that we did not scan this tag already in this current run
        # and also, that even in case we did scan it, the file still exists
        # if we did not scan the tag in this run or if the file does not exit,
        # although we scanned the tag, we need to go on and scan and store it
        if (self.tagID in self.allReadTags and self.tagID.isTagStored()):
            pass
        else:
            if appDebug:
                print("New Tag " + self.tagID + " found")

            # put tag in list of already read tags
            self.allReadTags.append(self.tagID)

            if (self.tagID.isTagStored()):
                if appDebug:
                    print("Tag " + self.tagID + " already stored")
            else:
                if appDebug:
                    # Ausgabe der Daten
                    print("")
                    print("New Tag " + self.tagID)
                    print("------------------------------------------")
                    print("TagId: ", self.tagID)
                    print("PreTag: ", self.PreTag)
                    print("Checksumme: ", self.Checksumme)
                    print("EawData: ", self.ID)
                    print("------------------------------------------")
                    print("Waiting for next Tag")
                    print("")
        return (self.tagID)

    def isTagSTored(self):
        pass:

    def stop(self):
        self.UART.close()


def main():
    if (len(sys.argv) > 1):
        readTags = RFIDReader()

        if (sys.argv[1] == '--readtags'):
            appDebug = True
            rfidreader = RFIDReader()

            if appDebug:
                print("Starting up - press Ctrl + C to stop")
            try:
                while True:
                    tagID = rfidreader.run()
                    time.sleep(0.5)
            except KeyboardInterrupt:
                print("closing ...")
                readTags.stop()

        else:
            print("If called from command line, you can only read RFID tags with this script. Call it with --readtags")
    else:
        print("If called from command line, you can only read RFID tags with this script. Call it with --readtags")


if __name__ == '__main__':
    main()
