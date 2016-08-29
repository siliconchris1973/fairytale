#!/usr/bin/env python3
# encoding: utf-8

"""
book.py

Contains the class that represents the book that is currently playing
"""


__version_info__ = (0, 0, 1)
__version__ = '.'.join(map(str, __version_info__))
__author__ = "c.guenther@mac.com"


class Book(object):
    """The book that is currenty playing"""

    def __init__(self):
        """Initialize"""

        self.book_id = None
        self.part = 1
        self.elapsed = .0
        self.file_info = None

    def reset(self):
        """Reset progress"""

        self.__init__()

    def set_progress(self, progress):
        """Set progess from db result"""

        if progress:
            self.elapsed = progress[1]
            self.part = progress[2]

    def is_playing(self):
        """returns if we have a current book"""
        return self.book_id is not None
