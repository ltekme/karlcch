from flask import render_template
from . import sitemapper, app

@sitemapper.include(lastmod="2024-05-09")
@app.route('/')
def index():
    return render_template('index.html.j2', title='KarlCCH | Home', metadata_description='Home of karlcch', config=app.config)

