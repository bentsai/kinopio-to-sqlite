from datasette import hookimpl
import jinja2

@hookimpl
def render_cell(value, column):
    if column != "background":
        return None
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    if len(stripped) == 0:
        return None
    return jinja2.Markup('<img style="height: 50px; width: 50px; border-radius: 3px; margin: 5px;" src="{src}">'.format(
        src=jinja2.escape(stripped)
    ))