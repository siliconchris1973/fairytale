# fairytale
## Introduction
Fairytale is an Arduino powered mp3-player designed to play audiobooks (or any MP3 for that matter) from an SD Card. The user controls this playback, that is which Audiobook or Album to play, via NFC tags that he/she may bring near an NFC Reader.

This tags could for example be attached to little figures - such as Snowhite. Of course you could just put them on little dices or whatever suits you - just keep in mind that my box is supposed to be used by my 4 year old daughter and therefor I use little figures.

Fairytale operates from an Arduino UNO V3 onto which an Adafruit Music Maker Shield is attached.
Furthermore there is a Sunfounder PN532 NFC breakout board attached to it and finally a potentiometer
for volume control and 4 buttons for pause/unpause, next or previous track selection and light effects (turning them on and off).
Oh, yes and then of course there is an LED for light effects :-) for warnings and for errors.

As there is no screen included with this MP3 player, certain situations (mainly warnings and errors) are spoken.


## Background
To read the story that initially inspired me to do this project, visit: https://gist.github.com/wkjagt/814b3f62ea03c7b1a765

### First Try Raspberry PI
I started this project off on a Raspberry PI but gave up on it - mainly for three reasons:
1. The Raspberry PI needs way too much time to startup
2. I can't just turn it off because of the danger of damaging the SD Card
3. The volume of the sound output of the RasPi is very limited

All in all, the RasPi approach is not as failsave for a 4 year old, so I gave it up and used the Arduino UNO as the base platform. If you'd nevertheless like to give the RasPi approach a try, you can find the latest state of work in the sub directory RASPI-stuff - be aware though that I never finished it and that there is no guideline on how to build it.

### Second / Final Try Arduino
This is what I present here, an NFC controlled MP3 Audiobook Player for my daughter based on an Arduino UNO, Adafruit Music Maker Shield and Sunfounder PN532 NFC Breakout Board.

# Building Fairytale
Following one may find the a (hopefully) complete step by step instruction on how to build Fairytale.

## Hardware design
This section explains components and hardware layout as well of wiring the different components that make up Fairytale.

### Components
- Arduino UNO V3
- Adafruit Music Maker Shield
- Sunfounder PN532 NFC Reader
- Adafruit Powerboost 1000c
- 3W Speaker - Mine is quite big as can be seen in the pictures but of course you could use any speaker that fits you. Just make sure it can handle the 3 watts output of the Adafruit Music Maker Shield.
- LiPo Battery - I have a very big battery and that is good, as it gives plenty of playback time.
- 5 Push buttons - 4 to control the operation and one to program a new tag.
- 3 LEDs - 1 operations light, 1 warning and 1 error light
- 1 Potentiometer for volume control
- Wires to connect everything together
- Hot Glue to attach all the stuff in the box
- Box - Mine is wooden but I also have a 3D model for a plastic box

### Hardware layout
All components are of course put into a "little" box - mine is made of wood and I bought it from shelf. I dismantled the top lit and exchanged that with a plain plate of same size.

#### Speaker
The speaker is directed to the bottom but slightly above the bottom of the box - roughly a centimeter from it. I attached the speaker to a wooden square with a hole the size of the speaker, attached 4 pillars to it to raise this square from the box' bottom. I also created an opening in the bottom of the box and attached some fiber to shield the speaker. Finally I put 4 pillars to the bottom of the box to raise it from ground.

To be honest, this whole layout is a very unfortunate design choice, as the sound is not that strong and clear as it could be. If I'd had it directed to the front, of course the sound would have been stronger and possibly not as muffled, but I wanted to have the volume control (see below) to stick out of the front).

#### NFC Reader
The NFC Reader is attached to the underside of the top of the box and the top itself is fixed to the box via small nails. I also carved out an oblong opening in this top plate to make room for the 4 buttons. The buttons are again fixed to the top plate by means of a small piece of wood glued to the plate - see pictures here.

#### Adafruit Powerboost 1000c / LiPo Battery
The Adafruit Powerboost 1000c is glued to on side very low to the bottom of the box and the battery is standing upright in the front left corner. For this I had to create a small opening in the plate that supports the speaker.

#### Arduino / Music Maker Shield
Opposite the battery the Arduino UNO with attached Adafruit Music Maker Shield is glued to the box. This allows for a small opening on the back of the box. This opening can be used to retrieve and insert the SD card from / into the Music Maker Shield and it also gives access to the USB port for programming purposes of the Arduino - all this without the need to open the top plate of the box.

#### Buttons
The 4 buttons (see below) are on the top plate and the volume control pot is on the front.

#### Lights
Also on the front is the operations light, whereas the Error light (also used for LBO) is on the back. The warning LED is on the left side. You can see my design in the pictures.

### Control Buttons
The Fairytale audiobook reader box design comes with 4 buttons to control operation:
- pause / unpause     - pauses the playback or unpauses a paused playback
- next                - play the next track in a consecutive list of ordered files
- previous            - play the previous track in a consecutive list of ordered files
- light on / off      - turn the operations light fader on or off

Additionally there is a programming button (A3 see below) included that will change the program in such a way that it will wait for a "new" tag, ask for a directory and track number to associate with this tag and will update the TrackDb accordingly. For this to work the box of course would need to be connected to the Arduino IDE and the serial console must be active. Functionality is not yet implemented)

All 4 control buttons are attached to only one analog pin (here A1). To distinguish which button was pressed, I made sure every button has a resistor with a different Ohm attached to it's input pin. I used:
- 33 Ohm
- 220 Ohm
- 330 Ohm
- 1 KOhm


### Volume Control
A potentiometer connected to analog input pin A0 on the Arduino is used for volume control. While playing a track the program checks for changes on the potentiometer and calculates the corresponding volume from the level of the pot.

### Used Pins of the Arduino UNO:
Quite a few, if not nearly all, of the pins of the Arduino are used up.

#### SPI
- 13 : CLK / PN532_SCK : SPI Clock shared with VS1053, SD card and NFC breakout board
- 12 : MISO / PN532_MISO : Input data from VS1053, SD card and NFC breakout board
- 11 : MOSI / PN532_MOSI : Output data to VS1053, SD card and NFC breakout board

#### VS1053 Music Maker Shield
- 7 : SHIELD_CS : VS1053 chip select pin (output)
- 6 : SHIELD_DCS : VS1053 Data/command select pin (output)
- 3 : DREQ : VS1053 Data request, ideally an Interrupt pin

#### SD Card
- 4 CARDCS : SD Card chip select pin

#### PN532 NFC Reader
- 10 : PN532_SS : NFC breakout board chip select pin

#### LEDs
- 5 : ledPin : the pin to which the operation led is connected to
- 8 : warnPin : the pin to which the warning led is connected to
- 9 errorPin : the pin to which the error led is connected to (e.g. used for LBO of powerboost 1000c)

#### Input Buttons etc.
- A0 : volumePotPin : the analog input pin that we use for the potentiometer
- A1 : btnLinePin : pin to which the button line (4 buttons) is connected to
- A2 : batLowInputPin : the pin on which the powerboost 1000c indicates a low battery (LBO) - ouput done via errorPin (not yet implemented)
- A3 : programming : the pin the program button is connected to (not yet implemented).

### Putting all together
#### Power line duplicator
The Arduino has very limited power and ground output pins, so I decided to get +5V and +3V and Ground from the Adafruit Powerboost and have a little "power line duplicator" - This power line duplicator is essentially a little (3cm x 1,5cm) plate onto which a couple of male headers are attached which are connected to +5V, +3V and GND of the Powerboost - This gives me 5 pins for +5V, 5 pins for +3V and also 5 pins for Ground.

To this "power line duplicator" I attached all external components that needed plus voltage and ground - such as the PN532 NFC Reader breakout board or the power for the buttons and the volume control.

#### Buttons
I also had to restrict the number of input pins used by the buttons, as quite a lot of the digital or analog input pins of the Arduino are already used up.

I connected the 4 control buttons to only one analog input pin (here A1) and used different resistors to distinguish which button is pressed. I took the input power from the +5V line. The buttons output is also tied (via a 10KOhm resistor) to ground to keep it from floating.

The volume control potentiometer is attached to A0 and is also connected to ground via a 10KOhm resistor. It's input voltage is taken from the +5V line.

The programming button is attached to the +3V line and tied to A3 with it's second leg - no ground connection.

#### Low Battery Output
The Adafruit Powerboost 1000c comes with an LBO (Low Battery Output). This usually ties to the battery plus line but ties to ground once the battery reaches a level of roughly 3,4V. So I attached a wire to the LBO pin of the Powerboost and connected it to A2 plus ground (via a 100KOhm resistor)
ATTENTION: This is not yet operational!!!

## Software Design / Operations
The Fairytale program will play albums (audiobooks or music) stored on the SD card inserted into
the Adafruit Music Maker Shield. Selection of the album/audiobook to play is done by
placing corresponding NFC Tags on the NFC Reader.


### Track DB - connect NFC Tag to Audiobook
Upon detection of an NFC Tag, the program will retrieve the tag's UID and use this to scan what I call the TrackDB to find a matching directory to play.

The TrackDB is a list of files in a special directory (SYSTEM00) on the SD card. The TrackDB
files are of the form:

    taguid:directory:track number

e.g.:    

    46722634231761290:findorie:1

In the given example:
- 46722634231761290 is the UID of the NFC Tag
- findorie is the directory from which to play the files
- 1 is the number of the track with which to start playback|

### Playback
The program will take the retrieved information from the TrackDB and then start a for-loop beginning with
the provided first track until all consecutive numbered tracks are played. After playback of all
files is finished, the program will resume it's main loop, delay operation for roughly 15 seconds
(to give the user the chance to remove the just used Tag from the reader) and then wait until
it detects the next tag.

While advancing through the files in the directory, the program will update the TrackDB-File with the
number of the currently played track. Doing so allows for interrupted playbacks - tag is removed and
later put back on when the playback will start with the last track in playback.

### Restrictions
For this to work, a couple of restrictions are in place:
1. All filenames must be in the format  trackXXX.mp3  - where XXX is a numbering from 001 to 127
2. You can have a maximum of 127 files per directory - as I use a char to count the files to preserve memory
3. All directory names must be exactly 8 chars long - use any combination of a-z and 0-9 chars for the name
4. if a file is missing in a consecutive order of files in a directory, you may get a (very short) pause which might result in a glitch in the sound while the next track number is calculated
5. All directories must be directly in the root- directory of the SD card - no sub directories are allowed as I use a char array of 9 chars for the directory part of the path to the file.


### Lights
While the album (or file) is played an operations light is fading up and down in intensity.

On warnings or errors a warning or error light is lit up respectively.


### Errors and Warnings
There are 3 different warning or error conditions:
1. Missing or invalid information for playback warning
2. Low Battery warning
3. Missing or hardware failure error

Additionally we distinct warnings and errors for whether or not we need to turn off the box.

#### Errors
Errors shown via the error light (also cause the system to halt and the Box must be turned off):
- Music Maker Shield not found
- Music Maker shield not on an interrupt enabled pin
- SD card not found
- NFC Reader not found (currently no light effect implemented)

#### Warnings
Warnings shown via a light (Arduino can stay turned on):
- no directory found for the NFC Tag (aka TrackDB is missing an entry for the Tag)
- no directory found on the SD card that match the NFC Tag TrackDB record
- no files in the provided directory
- a missing file in a consecutive list of ordered files in the directory
 this may happen in case the files are not numerically ordered without a gap:
 track001.mp3 exist, track002.mp3 is missing but track003.mp3 exists again

Additionally if the Adafruit Powerboost 1000c detects a low battery level (LBO of the Powerboost ties to ground) the error LED is shown. Surely the Arduino will turn off at some point from now, but until then it will continue to operate.


#### Voice feedback
Additionally to the warning or error lights certain messages are spoken through the music maker shield.
Voiced errors and warnings are:
- Low Battery warning (only voiced if no album is playing)
- No directory found for the NFC Tag (aka TrackDB is missing an entry for the Tag)
- No directory found on the SD card that match the NFC Tag TrackDB record
- No file(s) in the directory on the SD card
- PN532 NFC Reader is malfunctioning.
