import base64, re, pathlib
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent

img = Image.open(root/'assets/mark-1024.png')
img.thumbnail((256,256))
tmp_webp = pathlib.Path('/tmp/mark-256.webp')
img.save(tmp_webp, 'WEBP', quality=82)
mark_b = tmp_webp.read_bytes()

html = (root/'index.html').read_text()
css = (root/'css/styles.css').read_text()
js = (root/'js/main.js').read_text()

font_block_end = css.find('/* ── Tokens')
gf = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@1,400;1,500&family=IBM+Plex+Mono:wght@400;500&display=swap');\n"
css_test = gf + css[font_block_end:]

html = re.sub(r'src="assets/mark-[^"]+"', 'src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-mark', html)
html = re.sub(r'\s*<link rel="(preload|icon|apple-touch-icon)"[^>]*/>', '', html)
html = html.replace('<link rel="stylesheet" href="css/styles.css" />', '<style>' + css_test + '</style>')

mark_uri = 'data:image/webp;base64,' + base64.b64encode(mark_b).decode()
mark_script = '<script>addEventListener("DOMContentLoaded",()=>{const M="' + mark_uri + '";document.querySelectorAll("[data-mark]").forEach(i=>i.src=M)});</script>'

html = html.replace('<script src="js/vendor/gsap.min.js"></script>', mark_script + '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>')
html = html.replace('<script src="js/vendor/ScrollTrigger.min.js"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>')
html = html.replace('<script src="js/vendor/lenis.min.js"></script>', '<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>')
html = html.replace('<script src="js/main.js"></script>', '<script>' + js + '</script>')

data_url = 'data:text/html;base64,' + base64.b64encode(html.encode()).decode()
pathlib.Path('/tmp/data_url.txt').write_text(data_url)
print('data_url.txt written:', len(data_url), 'bytes')
