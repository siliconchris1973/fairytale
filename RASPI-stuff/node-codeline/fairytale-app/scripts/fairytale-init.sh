#! /bin/sh
# /etc/init.d/fairytale

### BEGIN INIT INFO
# Provides:          fairytale
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Simple script to start a program at boot
# Description:       A simple script from www.stuffaboutcode.com which will start / stop a program a boot / shutdown.
### END INIT INFO

# If you want a command to always run, put it here

# Carry out specific functions when asked to by the system
case "$1" in
  start)
    echo "Starting Fairytale"
    # run application you want to start
    cd /home/pi/fairytale/fairytale-app && npm start &
    ;;
  stop)
    echo "Stopping Fairytale"
    # kill application you want to stop
    killall node
    ;;
  *)
    echo "Usage: /etc/init.d/fairytale {start|stop}"
    exit 1
    ;;
esac

exit 0
