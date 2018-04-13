#! /bin/bash
# note, untested, try on new machine first
# also this is after github.com/chriscauley/org/start.sh is run successfully

SDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PDIR=$SDIR/../

cd ~

git clone https://github.com/chriscauley/django-drop.git
git clone https://github.com/chriscauley/lablackey.git
git clone https://github.com/chriscauley/django-unrest-media.git

cd $PDIR
mkdir .dev
ln -s $HOME/django-drop/drop/ $PDIR/.dev/
ln -s $HOME/lablackey/lablackey/ $PDIR/.dev/
ln -s $HOME/django-unrest-media/media/ $PDIR/.dev/

ln -s $SDIR/nginx.conf /etc/nginx/sites-enabled/thegamesupply.conf
sudo service nginx restart
ln -s $SDIR/post-receive $PDIR/.git/hooks/post-receive
chmod +x $SDIR/*.sh $SDIR/post-receive

echo -e "Done! \n\n"

echo "FINAL TODO:"
echo "+ Create the appropriate database, most likely in:"
echo "   main/settings/local.py or main/settings/`hostname`.py"
echo "+ Run ./manage.py syncdb and ./manage.py migrate or load a database file."
echo "+ If this is not a development project, on your machine create a git remote:"
echo "   git remote add [staging|live|temp] deploy@[hostname]:${SITE} "
echo "+ Set bare=true in .git/config when you are ready to start pushing."
