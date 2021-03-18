from datasette import hookimpl
import jinja2

@hookimpl
def render_cell(value, column):
    if column != "url":
        return None
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return jinja2.Markup('<a href="{href}">↗</a>'.format(
        href=jinja2.escape("https://kinopio.club/" + stripped)
    ))