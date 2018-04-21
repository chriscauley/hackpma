## Installation Instructions

The following should work on Mac or Linux. Before you begin you'll need to install sqlite3 with brew or apt.

```
sudo easy_install pip` # Install pip

sudo pip install virtualenv # Install virtualenv

git clone https://github.com/chriscauley/hackpma.git # Clone this repo

cd hackpma; virtualenv .e # Create virtualenv

source .e/bin/activate # load virtualenv (you'll need to this anytime you want to use manage.py)

pip install -r requirements.txt # install python dependencies

cp main/settings/_local_example.py main/settings/local.py # your private settings that do not go in repo

# at this point you should go to https://hackathon.philamuseum.org/token and put a key in main/settings/local.py

python manage.py migrate # creates database at main/db.sqlite

python p.py # populate database with museum api data. This will print a bunch of stuff and take ~10 minutes

python manage.py runserver # hosts copy of site at http://localhost:8000
```

