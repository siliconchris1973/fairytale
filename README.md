# fairytale
## Introduction
Fairytale is a mp3-player designed to play audiobooks from an SD Card. The Audiobooks are connected to NFC Tags via the Tag ID, so if you put a Tag on the reader, the corresponding audiobook is played

This tags could for example be attached to little figures - such as Snowhite. Of course you could just put them on little dices or whatever suits you - just keep in mind that my box is supposed to be used by my 4 year old daughter and therefor I use little figures.

The initial version of fairytale ran on an Arduino UNO V3 onto which an Adafruit Music Maker Shield was attached - the code for this version can be found in Arduino_codeline
The version 2 now uses a Raspberry Pi PiCo 2 W (with WLAN) - the code for this version can be found in PiCo_codeline

Furthermore there is a Sunfounder PN532 NFC breakout board attached to it and finally a potentiometer
for volume control and 4 buttons for pause/unpause, next or previous track selection and light effects (turning them on and off).
In version 2 of fairytale an OLED Screen and a RTC clock is included in the setup.
Oh, yes and then of course there is an LED for light effects :-) for warnings and for errors.

## Background
To read the story that initially inspired me to do this project, visit: https://gist.github.com/wkjagt/814b3f62ea03c7b1a765

### Initial (discarded) try Raspberry PI
I started this project off on a Raspberry PI but gave up on it - mainly for three reasons:
1. The Raspberry PI needs way too much time to startup
2. I can't just turn it off because of the danger of damaging the SD Card
3. The volume of the sound output of the RasPi is very limited

All in all, the RasPi approach is not as failsave for a 4 year old, so I gave it up and used the Arduino UNO as the base platform. If you'd nevertheless like to give the RasPi approach a try, you can find the latest state of work in the sub directory RASPI-stuff - be aware though that I never finished it and that there is no guideline on how to build it.

### Version 1 Arduino
NFC controlled MP3 Audiobook Player for my daughter based on an Arduino UNO, Adafruit Music Maker Shield and Sunfounder PN532 NFC Breakout Board.

### Version 2 PiCo
NFC controlled MP3 Audiobook Player for my daughter based on an Raspberry Pi PiCo 2 W, Adafruit Music Maker Shield, Elechouse PN532 NFC Breakout Board V3, DS3231 compatible RTC clokc, SH1106 compatible 128x64 OLED display.

