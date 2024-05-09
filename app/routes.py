from io import StringIO, BytesIO
from flask import render_template, send_from_directory, send_file, request
from . import app, sitemapper


@app.route('/static/<path:path>')
def static_content(path):
    return send_from_directory('static', path)


from . import pages


@app.route('/favicon.ico')
def favicon_ico():
    return send_from_directory('resources', 'favicon.ico')


@app.route('/robots.txt')
def robots():
    # get hostname
    hostname = app.config.get('SERVER_NAME') or request.host
    if request.is_secure:
        hostname = 'https://' + hostname
    else:
        hostname = 'http://' + hostname

    # setup robots file
    robot_file = f'''# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
sitemap: {hostname}/sitemap.xml'''

    # store as file in memory
    mem = BytesIO()
    mem.write(robot_file.encode('utf8'))
    mem.seek(0)

    return send_file(mem, mimetype='text/plain', as_attachment=False, download_name='robots.txt')


@app.route('/errors.html')
def error_file():
    return render_template('errors.html.j2', title='karlcch')


@app.errorhandler(404)
def error_not_found(err):
    return error_file(), 404


@app.route("/sitemap.xml")
def sitemap():
    return sitemapper.generate()
