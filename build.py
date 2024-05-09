# load env must be placed before app import
from dotenv import load_dotenv
load_dotenv('.flaskenv')

import os
from flask_frozen import Freezer
from app import app

if __name__ == '__main__':
    basedir = os.path.dirname(__file__)
    app.config['FREEZER_DESTINATION'] = os.path.join(basedir, '.build')
    freezer = Freezer(app)
    freezer.freeze()
