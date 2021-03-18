from datasette import hookimpl
import jinja2

@hookimpl
def render_cell(value, column):
    if column != "color":
        return None
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return jinja2.Markup('<div style="background-color: {hex}; height: 14px; width: 14px; border-radius: 3px; margin: 5px;"></div>'.format(
        hex=jinja2.escape(stripped)
    ))