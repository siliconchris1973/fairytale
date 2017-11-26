#!/usr/bin/env python3
# encoding: utf-8

"""
populate_db.py

reads in stored JSON Files from directory rfidTagData to populate the internal SQLLite DB with preset audio books.

check read_new_rfid.py to see how to create a new audiobook based on a new rfid tag.
"""


__version_info__ = (0, 0, 1)
__version__ = '.'.join(map(str, __version_info__))
__author__ = "c.guenther@mac.com"

import os
import config
from status_light import StatusLight
import RPi.GPIO as GPIO
import sqlite3
import signal
from threading import Thread


class Importer():
    def __init__(self):
        """Initialize the intenal database with stored json files defining audiobooks"""

        # setup signal handlers. SIGINT for KeyboardInterrupt
        # and SIGTERM for when running from supervisord
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

        self.status_light = StatusLight(config.status_light_pin)
        thread = Thread(target=self.status_light.start)
        thread.start()

        self.setup_db()
        self.setup_gpio()


    def setup_db(self):
        """Setup a connection to the SQLite db"""

        self.db_conn = sqlite3.connect(config.db_file)
        self.db_cursor = self.db_conn.cursor()


    def setup_gpio(self):
        """Setup all GPIO pins"""

        GPIO.setmode(GPIO.BCM)

