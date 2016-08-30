#!/usr/bin/env python3
# encoding: utf-8

"""
config.py

Application configurations

db_file : the SQLite file used to store the progress
serial : settings for the serial port that the RFID reader connects to
mpd_conn : the connection details for the MPD client
gpio_pins : the ids of the GPIO input pins and their callbacks
status_light_pin : the pin used by the status light
playing : keep track of playing status. rather use this instead of calling
          status() all the time"""

import os

__version_info__ = (0, 0, 1)
__version__ = '.'.join(map(str, __version_info__))
__author__ = "c.guenther@mac.com"


db_file = "%s/%s" % (os.path.dirname(os.path.realpath(__file__)), 'state.db')
serial = { "port_name" : "/dev/ttyAMA0", "baudrate" : 9600, "string_length" : 14 }
mpd_conn = { "host" : "localhost", "port" : 6600 }
gpio_pins = [
    { 'pin_id': 9, 'callback' : 'rewind', 'bounce_time' : 2000 },
    { 'pin_id': 11, 'callback' : 'toggle_pause', 'bounce_time' : 2000 },
    { 'pin_id': 22, 'callback' : 'volume_down', 'bounce_time' : 1000 },
    { 'pin_id': 10, 'callback' : 'volume_up', 'bounce_time' : 1000 }
]
status_light_pin = 23
abook_picture_path = '/home/pi/fairytale/bookData/Cover/'
abook_file_path = '/home/pi/fairytale/bookData/Audiobooks/'
picture_extensions = ['png', 'jpg', 'jpeg', 'gif']
audio_extensions = ['mp3', 'mp4', 'wav', 'au']
