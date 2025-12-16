# state.py
import ujson as json
from config import (
                STATE_DIR,
                _DEBUG_STAT as _DEBUG
                )

def state_path(uid_str):
    if _DEBUG: print("[STATE] State Dir is " + str(state_path))
    return "{}/{}.json".format(STATE_DIR, uid_str)

def load(uid_str):
    try:
        with open(state_path(uid_str), 'r') as f:
            return json.load(f)
    except Exception as e:
        if _DEBUG: print("[STATE] Exception during state dir operning " + str(e))
        return {"chapter": "track001.mp3", "offset": 0, "volume": 60}  # 0..100 (VS1053-Lautstärke abgebildet)

def save(uid_str, data):
    with open(state_path(uid_str), 'w') as f:
        json.dump(data, f)
