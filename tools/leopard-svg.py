# Draws the snow-leopard easter egg as SVG, closely following the pose and proportions of the meme photo.
import random, sys, math
random.seed(7)
W, H = 400, 530
out = []
A = out.append

A(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
A('<title>A drawn snow leopard with big round eyes raises its paw towards you</title>')
A('''<defs>
 <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0.6">
  <stop offset="0" stop-color="#33404c"/><stop offset="0.45" stop-color="#5d6b78"/><stop offset="1" stop-color="#a3afba"/>
 </linearGradient>
 <radialGradient id="face" cx="50%" cy="58%" r="60%">
  <stop offset="0" stop-color="#f2f1ee"/><stop offset="0.55" stop-color="#dddcd8"/><stop offset="1" stop-color="#9e9c98"/>
 </radialGradient>
 <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#a9a8a4"/><stop offset="0.3" stop-color="#e4e3df"/><stop offset="0.62" stop-color="#d9d8d4"/><stop offset="1" stop-color="#7f7e7b"/>
 </linearGradient>
 <radialGradient id="eye" cx="46%" cy="44%" r="58%">
  <stop offset="0" stop-color="#3b2a20"/><stop offset="0.35" stop-color="#1a120e"/><stop offset="0.82" stop-color="#0c0908"/><stop offset="1" stop-color="#000"/>
 </radialGradient>
 <radialGradient id="iris" cx="50%" cy="62%" r="55%">
  <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="0.9" stop-color="#6a4a35" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
 </radialGradient>
 <radialGradient id="paw" cx="50%" cy="40%" r="65%">
  <stop offset="0" stop-color="#f7f6f3"/><stop offset="0.7" stop-color="#e2e1dd"/><stop offset="1" stop-color="#b5b3ae"/>
 </radialGradient>
 <linearGradient id="ear" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#e6e2de"/><stop offset="1" stop-color="#bdb6b1"/>
 </linearGradient>
 <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1"/></filter>
 <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
 <filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/>
  <feComposite in2="SourceGraphic" operator="in"/>
 </filter>
 <filter id="fur" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.09 0.05" numOctaves="2" seed="5" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
 </filter>
 <clipPath id="card"><rect width="400" height="530" rx="20"/></clipPath>
 <clipPath id="headclip"><path id="headpath" d="M195 54 C 262 52 314 84 324 138 C 332 186 314 232 268 254 C 246 264 220 270 195 270 C 170 270 144 264 122 254 C 76 232 58 186 66 138 C 76 84 128 56 195 54 Z"/></clipPath>
</defs>''')
A('<g clip-path="url(#card)">')
# blurred background, darker top-left, light on the right (like the photo)
A('<rect width="400" height="530" fill="url(#bg)"/>')
A('<g filter="url(#blur6)" opacity="0.5"><ellipse cx="360" cy="120" rx="70" ry="140" fill="#c4ced6"/><ellipse cx="30" cy="60" rx="60" ry="90" fill="#26313b"/></g>')

# neck and chest
A('<g filter="url(#fur)">')
A('<path d="M84 226 C 66 300 50 420 40 530 L 346 530 C 340 420 328 300 308 226 Z" fill="url(#body)"/>')
A('<path d="M128 252 C 112 340 116 440 120 530 L 278 530 C 284 440 288 340 270 252 Z" fill="#f1f0ec" opacity="0.8"/>')
# chest rosettes: broken dark strokes on the sides
def rosette(cx, cy, r, w, rot):
    segs = []
    a0 = rot
    for k in range(random.choice([2, 3])):
        a1 = a0 + random.uniform(0.7, 1.4)
        x0, y0 = cx + r * math.cos(a0), cy + r * 0.75 * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * 0.75 * math.sin(a1)
        segs.append(f'<path d="M{x0:.1f} {y0:.1f} A {r} {r*0.75:.1f} 0 0 1 {x1:.1f} {y1:.1f}" stroke-width="{w:.1f}"/>')
        a0 = a1 + random.uniform(0.4, 0.9)
    return "".join(segs)
def blob(cx, cy, rx, ry, rot):
    n = 7; P = []
    for k in range(n):
        a = rot + 2 * math.pi * k / n
        f = random.uniform(0.65, 1.15)
        P.append((cx + rx * f * math.cos(a), cy + ry * f * math.sin(a)))
    d = f"M{(P[0][0]+P[-1][0])/2:.1f} {(P[0][1]+P[-1][1])/2:.1f} "
    for i in range(n):
        q = P[i]; m = P[(i + 1) % n]
        d += f"Q {q[0]:.1f} {q[1]:.1f} {(q[0]+m[0])/2:.1f} {(q[1]+m[1])/2:.1f} "
    return f'<path d="{d}Z"/>'
A('<g fill="#1c1918" opacity="0.93">')
for (cx, cy) in [(66,292),(58,338),(84,372),(52,402),(78,436),(56,470),(90,500),(62,520),(108,300),(112,350),(104,410),(118,460),
                 (324,292),(332,336),(306,370),(338,400),(312,436),(334,470),(300,500),(328,520),(282,300),(278,352),(288,410),(272,462),
                 (150,292),(242,292),(140,330),(252,336),(130,470),(262,480),(150,510),(244,512)]:
    A(blob(cx, cy, random.uniform(9, 15), random.uniform(5, 9), random.uniform(-0.6, 0.6)))
A('</g>')
A('</g>')
A('<g fill="none" stroke="#1f1c1b" stroke-linecap="round" opacity="0" display="none">')
for (cx, cy, r) in [(62, 300, 16), (52, 360, 18), (80, 405, 15), (48, 450, 17), (88, 480, 14), (60, 515, 16),
                    (325, 300, 15), (338, 355, 17), (312, 405, 16), (340, 450, 15), (305, 490, 15), (335, 515, 14),
                    (112, 280, 11), (285, 280, 11), (102, 340, 10), (292, 345, 10)]:
    A(rosette(cx, cy, r, random.uniform(5, 7.5), random.uniform(0, 6.28)))
A('</g>')

# ears (behind the head): dark rim, pale inside, slightly pointed and tilted outwards
A('<path d="M70 136 C 54 96 54 52 70 24 C 96 32 124 56 138 86 Z" fill="#3e3b39"/>')
A('<path d="M82 124 C 72 94 70 64 78 42 C 98 52 116 70 126 92 Z" fill="url(#ear)"/>')
A('<path d="M320 136 C 336 96 336 52 320 24 C 294 32 266 56 252 86 Z" fill="#3e3b39"/>')
A('<path d="M308 124 C 318 94 320 64 312 42 C 292 52 274 70 264 92 Z" fill="url(#ear)"/>')

# head
A('<g filter="url(#fur)"><use href="#headpath" fill="url(#face)"/></g>')
A('<g clip-path="url(#headclip)">')
# muzzle and cheeks: white
A('<ellipse cx="195" cy="226" rx="62" ry="42" fill="#f7f6f3"/>')
A('<path d="M178 140 C 184 168 186 184 184 196 L 206 196 C 204 184 206 168 212 140 Z" fill="#a9a6a2" opacity="0.6"/>')
A('<ellipse cx="90" cy="175" rx="26" ry="50" fill="#9d9b97" opacity="0.35"/><ellipse cx="300" cy="175" rx="26" ry="50" fill="#9d9b97" opacity="0.35"/>')
A('<ellipse cx="165" cy="226" rx="38" ry="28" fill="#fbfaf8"/><ellipse cx="226" cy="226" rx="38" ry="28" fill="#fbfaf8"/>')
A('<ellipse cx="195" cy="160" rx="22" ry="40" fill="#f3f2ef" opacity="0.35"/>')
# dense small spots on the forehead and top of the head
A('<g fill="#1e1b1a">')
pts = []
for _ in range(900):
    x, y = random.uniform(80, 310), random.uniform(56, 128)
    # keep inside an arch above the eyes, sparser towards the middle-bottom
    if ((x - 195) / 120) ** 2 + ((y - 128) / 74) ** 2 > 1: continue
    if y > 100 and abs(x - 195) < 95 and not (abs(x-195) < 30 and y < 120): continue
    if y > 102 and abs(x - 195) < 22: continue
    if any((x - a) ** 2 + (y - b) ** 2 < 70 for a, b in pts): continue
    pts.append((x, y))
    r = random.uniform(1.8, 3.6) if y > 70 else random.uniform(2.2, 4.4)
    A(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r:.1f}" ry="{r*random.uniform(0.7,1.1):.1f}"/>')
# a few spots between the eyes, down the bridge
for (x, y, r) in [(195, 116, 2.6), (186, 126, 2), (204, 126, 2), (195, 136, 1.8)]:
    A(f'<circle cx="{x}" cy="{y}" r="{r}"/>')
# cheek spots and side-of-head rosettes
for (x, y, r) in [(86, 150, 4), (80, 172, 5), (96, 196, 4), (304, 150, 4), (310, 172, 5), (294, 196, 4),
                  (100, 120, 3.5), (290, 118, 3.5), (78, 128, 3), (312, 128, 3), (118, 214, 3), (272, 214, 3)]:
    A(f'<circle cx="{x}" cy="{y}" r="{r}"/>')
A('</g>')
A('<g fill="none" stroke="#1e1b1a" stroke-linecap="round">')
# dark lines running from the outer eye corners down over the cheeks
A('<path d="M104 152 C 96 166 90 182 88 202" stroke-width="5"/>')
A('<path d="M286 152 C 294 166 300 182 302 202" stroke-width="5"/>')
A('<path d="M112 176 C 106 190 104 204 108 218" stroke-width="3.5"/>')
A('<path d="M278 176 C 284 190 286 204 282 218" stroke-width="3.5"/>')
# inner eye corners towards the nose
A('<path d="M162 150 C 168 166 174 180 178 192" stroke-width="2.4" opacity="0.6"/>')
A('<path d="M228 150 C 222 166 216 180 212 192" stroke-width="2.4" opacity="0.6"/>')
A('</g>')
A('</g>')  # end head clip

# eyes: big, glossy, dark brown with a thin amber ring and a sharp catchlight
for cx in (134, 256):
    A(f'<ellipse cx="{cx}" cy="136" rx="34" ry="31" fill="#e2e0dc"/>')
    A(f'<ellipse cx="{cx}" cy="137" rx="29" ry="27" fill="url(#eye)"/>')
    A(f'<ellipse cx="{cx}" cy="137" rx="29" ry="27" fill="url(#iris)"/>')
    A(f'<ellipse cx="{cx}" cy="137" rx="29" ry="27" fill="none" stroke="#0e0b0a" stroke-width="4"/>')
    A(f'<path d="M{cx-28} 128 C {cx-18} 106 {cx+18} 106 {cx+28} 128" fill="none" stroke="#1a1716" stroke-width="5" stroke-linecap="round"/>')
    A(f'<ellipse cx="{cx+9}" cy="126" rx="6.5" ry="5.5" fill="#fff"/>')
    A(f'<ellipse cx="{cx-10}" cy="148" rx="3" ry="2" fill="#fff" opacity="0.35"/>')

# nose: wide, pinkish grey with a dark rim, line down to the mouth
A('<path d="M174 196 C 182 192 208 192 216 196 C 216 206 205 216 195 218 C 185 216 174 206 174 196 Z" fill="#a4888a" stroke="#3a3030" stroke-width="2.6"/>')
A('<path d="M183 199 C 190 197 200 197 207 199" stroke="#c4a9a8" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
A('<path d="M195 218 L 195 230 M195 230 C 189 237 180 238 174 233 M195 230 C 201 237 210 238 216 233" fill="none" stroke="#2e2827" stroke-width="2.8" stroke-linecap="round"/>')
A('<g fill="#4a4442">' + "".join(f'<circle cx="{x}" cy="{y}" r="1.8"/>' for x, y in
  [(168, 220), (160, 214), (156, 225), (150, 218), (222, 220), (230, 214), (234, 225), (240, 218)]) + '</g>')
# chin shadow
A('<path d="M150 252 C 172 262 218 262 240 252" fill="none" stroke="#9c9a96" stroke-width="3" opacity="0.5"/>')

# the raised paw (slightly soft, as it moves towards the camera)
A('<g filter="url(#soft)" transform="translate(-34 -46) scale(1.16)">')
A('<path d="M154 530 C 152 500 150 482 152 466 L 238 466 C 240 482 238 500 236 530 Z" fill="#dcdbd7"/>')
A('<path d="M124 398 C 116 338 150 302 195 302 C 242 302 276 338 268 398 C 264 438 236 466 195 468 C 154 466 128 438 124 398 Z" fill="url(#paw)"/>')
A('<g fill="#121010">')
A('<ellipse cx="146" cy="344" rx="13" ry="18" transform="rotate(-22 146 344)"/>')
A('<ellipse cx="173" cy="324" rx="13.5" ry="19" transform="rotate(-8 173 324)"/>')
A('<ellipse cx="211" cy="324" rx="13.5" ry="19" transform="rotate(8 211 324)"/>')
A('<ellipse cx="240" cy="344" rx="13" ry="18" transform="rotate(22 240 344)"/>')
A('<path d="M193 376 C 224 376 246 396 246 420 C 246 444 228 452 216 448 C 206 444 200 439 193 439 C 186 439 180 444 170 448 C 158 452 140 444 140 420 C 140 396 162 376 193 376 Z"/>')
A('</g>')
# fur tufts between the toes and on the paw edge
A('<g fill="none" stroke="#f4f3f0" stroke-width="2" stroke-linecap="round" opacity="0.9">')
for x, y in [(159, 335), (192, 318), (226, 335), (160, 368), (226, 368)]:
    A(f'<path d="M{x} {y} l -3 8 M{x+2} {y} l 0 9 M{x+4} {y} l 3 8"/>')
A('</g>')
A('<g fill="#fff" opacity="0.16"><ellipse cx="170" cy="316" rx="4" ry="6"/><ellipse cx="208" cy="316" rx="4" ry="6"/><ellipse cx="178" cy="390" rx="14" ry="6"/></g>')
A('<g fill="#2a2625"><circle cx="160" cy="492" r="5"/><circle cx="228" cy="502" r="4"/><circle cx="196" cy="515" r="4.5"/></g>')
A('</g>')

# fur grain over everything
A('<rect width="400" height="530" filter="url(#grain)" opacity="0.18"/>')
A('</g>')
A('</svg>')
open(sys.argv[1], "w").write("\n".join(out))
print("ok", len(pts), "spots")
