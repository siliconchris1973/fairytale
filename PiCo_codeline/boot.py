# boot.py
import os
try:
    os.mkdir('/appstate')
except OSError:
    pass
