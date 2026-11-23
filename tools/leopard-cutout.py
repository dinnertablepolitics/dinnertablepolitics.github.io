import sys
from PIL import Image, ImageDraw, ImageFilter
im = Image.open('../images/6.webp').convert('RGB')
W, H = im.size
P = [
 (205,1445),(175,1250),(176,1050),(195,850),(214,690),(208,560),(200,440),(196,320),(196,200),(190,150),
 (195,110),(215,92),(245,90),(280,105),(315,135),(345,160),(420,158),(500,150),(580,150),(660,155),(720,160),
 (745,150),(775,115),(805,93),(828,92),(838,115),(838,170),(840,240),(845,330),(852,440),(858,540),(864,640),
 (875,800),(886,1000),(902,1200),(920,1445)]
mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mask).polygon(P, fill=255)
if len(sys.argv) > 1 and sys.argv[1] == 'check':
    o = im.copy(); d = ImageDraw.Draw(o); d.line(P + [P[0]], fill=(255,0,0), width=4)
    o.resize((W//2, H//2)).save('cut_check.png'); sys.exit()
mask = mask.filter(ImageFilter.GaussianBlur(4))
out = im.convert('RGBA'); out.putalpha(mask)
bbox = mask.getbbox(); out = out.crop((bbox[0], bbox[1], bbox[2], 1250))
WEB='/Users/juj/Desktop/UNI/Emp_M/Problemsets/PS3&4/website/assets/img/'
for w, n in [(400,'leopard-drawing.webp'),(800,'leopard-drawing-800.webp')]:
    h = round(out.height*w/out.width); out.resize((w,h), Image.LANCZOS).save(WEB+n, 'WEBP', quality=88, method=6, exact=True); print(n, w, h)
