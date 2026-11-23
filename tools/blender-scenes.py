# All 3D scenes for Dinner Table Politics, built from primitives.
#   Blender -b -P scenes.py -- <mode> <out> [engine] [samples] [width] [height]
# modes: hero (turntable animation, out = frame path prefix), still_hero, topdown, turkey,
#        track (ping-pong animation), question, magnifier, social
import bpy, math, sys, mathutils

A = sys.argv[sys.argv.index("--") + 1:]
MODE, OUT = A[0], A[1]
ENGINE = A[2] if len(A) > 2 else "CYCLES"
SAMPLES = int(A[3]) if len(A) > 3 else 64
RW = int(A[4]) if len(A) > 4 else 1600
RH = int(A[5]) if len(A) > 5 else 900

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def hexcol(h):
    h = h.lstrip("#"); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(r), lin(g), lin(b), 1.0)

def mat(name, hexc, rough=0.55, spec=0.3, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = hexcol(hexc)
    p.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in p.inputs: p.inputs["Specular IOR Level"].default_value = spec
    if emit and "Emission Strength" in p.inputs:
        p.inputs["Emission Color"].default_value = hexcol(hexc); p.inputs["Emission Strength"].default_value = emit
    return m

def smooth(o, bevel=None):
    for f in o.data.polygons: f.use_smooth = True
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL"); b.width = bevel; b.segments = 4
    return o

def add(kind, loc, scale=(1, 1, 1), rot=(0, 0, 0), material=None, parent=None, **kw):
    getattr(bpy.ops.mesh, "primitive_" + kind + "_add")(location=loc, rotation=rot, **kw)
    o = bpy.context.active_object; o.scale = scale
    if material: o.data.materials.append(material)
    if parent: o.parent = parent
    return o

M = {
    "floor": mat("floor", "#f3fcef", 0.95), "cloth": mat("cloth", "#fdfdfb", 0.85), "wood": mat("wood", "#b97a4b", 0.6),
    "chair": mat("chair", "#2f2f2f", 0.5), "plate": mat("plate", "#ffffff", 0.25, 0.5),
    "turkey": mat("turkey", "#b8692c", 0.4, 0.45), "turkey2": mat("turkey2", "#9a521f", 0.45), "bone": mat("bone", "#f4ead8", 0.6),
    "glass": mat("glass", "#d8eefc", 0.08, 0.6), "orange": mat("orange", "#ff6831", 0.5), "mint": mat("mint", "#8fe585", 0.6),
    "eye": mat("eye", "#111111", 0.25), "ink": mat("ink", "#111111", 0.4), "white": mat("white", "#ffffff", 0.4),
    "lens": mat("lens", "#e8f4ff", 0.02, 0.8), "gold": mat("gold", "#2b2b2b", 0.35, 0.6), "paper": mat("paper", "#ffffff", 0.7),
}
_lp = M["lens"].node_tree.nodes["Principled BSDF"]
for k in ("Transmission Weight", "Transmission"):
    if k in _lp.inputs: _lp.inputs[k].default_value = 1.0
_lp.inputs["IOR"].default_value = 1.35
POL = ["#1e3a8a", "#2f5fd0", "#8aa8ec", "#c5c5c5", "#f2a3a3", "#d93636", "#991b1b"]
def clay(m):
    p = m.node_tree.nodes["Principled BSDF"]
    for k, v in (("Subsurface Weight", 0.12), ("Sheen Weight", 0.35), ("Coat Weight", 0.08), ("Roughness", 0.62)):
        if k in p.inputs: p.inputs[k].default_value = v
    if "Subsurface Radius" in p.inputs: p.inputs["Subsurface Radius"].default_value = (0.3, 0.15, 0.1)
    return m
for i, c in enumerate(POL): M["pol%d" % i] = clay(mat("pol%d" % i, c, 0.5))
M["hi"] = mat("hi", "#ffffff", 0.2, 0.5, emit=0.6)
M["mouth"] = mat("mouth", "#3a1d1d", 0.5)
M["snow"] = clay(mat("snow", "#eceef0", 0.6)); M["spot"] = mat("spot", "#2b2d30", 0.55); M["nose"] = mat("nose", "#8a6f72", 0.45)
M["bean"] = mat("bean", "#1b1b1d", 0.35, 0.5); M["eyeL"] = mat("eyeL", "#030303", 0.12, 0.35)

def figure(x, y, ci, face_to=(0, 0), z0=0.0, scale=1.0, name=None):
    """capsule body + head + eyes, looking at face_to; returns an empty that holds it"""
    root = bpy.data.objects.new(name or "fig", None); scene.collection.objects.link(root)
    root.location = (x, y, z0); root.scale = (scale, scale, scale)
    col = M["pol%d" % ci]
    b = add("uv_sphere", (0, 0, 0.83), (0.42, 0.42, 0.8), segments=48, ring_count=24, material=col, parent=root); smooth(b)
    h = add("uv_sphere", (0, 0, 1.9), (0.42, 0.42, 0.42), segments=48, ring_count=24, material=col, parent=root); smooth(h)
    for s in (-1, 1):
        smooth(add("uv_sphere", (0.37, 0.15 * s, 1.98), (0.065, 0.065, 0.085), material=M["eye"], parent=root))
        smooth(add("uv_sphere", (0.415, 0.15 * s + 0.02, 2.02), (0.018, 0.018, 0.018), material=M["hi"], parent=root))
        arm = smooth(add("uv_sphere", (0.05, 0.44 * s, 0.95), (0.13, 0.13, 0.36), segments=24, ring_count=12, material=col, parent=root))
        arm.rotation_euler = (0, 0.15, -0.35 * s)
    bpy.ops.mesh.primitive_torus_add(location=(0.4, 0, 1.8), major_radius=0.07, minor_radius=0.014, rotation=(0, math.radians(90), 0))
    mo = bpy.context.active_object; mo.parent = root; mo.data.materials.append(M["mouth"])
    cut = add("cube", (0.4, 0, 1.86), (0.12, 0.12, 0.06), parent=root); cut.hide_render = True; cut.hide_viewport = True
    bm = mo.modifiers.new("smile", "BOOLEAN"); bm.object = cut; bm.operation = "DIFFERENCE"
    root.rotation_euler = (0, 0, math.atan2(face_to[1] - y, face_to[0] - x))
    return root

def table_scene(TR=2.2, seats=None, chairs=True):
    add("cylinder", (0, 0, 0.75), radius=0.18, depth=1.5, vertices=48, material=M["wood"])
    add("cylinder", (0, 0, 0.05), radius=0.8, depth=0.1, vertices=64, material=M["wood"])
    smooth(add("cylinder", (0, 0, 1.47), radius=TR + 0.16, depth=0.24, vertices=128, material=M["cloth"]), 0.05)
    add("cylinder", (0, 0, 1.6), radius=0.78, depth=0.06, vertices=96, material=M["plate"])
    smooth(add("uv_sphere", (0, 0, 1.92), (0.62, 0.48, 0.36), segments=48, ring_count=24, material=M["turkey"]))
    for s in (-1, 1):
        leg = smooth(add("uv_sphere", (0.42, s * 0.36, 1.86), (0.28, 0.16, 0.16), segments=32, ring_count=16, material=M["turkey2"]))
        leg.rotation_euler = (0, -0.5, s * 0.5)
        bone = smooth(add("cylinder", (0.72, s * 0.52, 1.98), radius=0.045, depth=0.26, material=M["bone"])); bone.rotation_euler = (0, 1.1, s * 0.6)
        smooth(add("uv_sphere", (0.82, s * 0.58, 2.04), (0.07, 0.07, 0.07), material=M["bone"]))
    for ang, m in ((40, "orange"), (140, "mint"), (220, "orange"), (320, "mint")):
        a = math.radians(ang); r = 1.2
        add("cylinder", (r * math.cos(a), r * math.sin(a), 1.6), radius=0.26, depth=0.05, vertices=48, material=M["plate"])
        smooth(add("uv_sphere", (r * math.cos(a), r * math.sin(a), 1.68), (0.2, 0.2, 0.09), material=M[m]))
    seats = seats or [(90, 1), (150, 5), (210, 2), (270, 6), (330, 0), (30, 4)]
    figs = []
    for ang, ci in seats:
        a = math.radians(ang); cx, cy = (TR + 0.95) * math.cos(a), (TR + 0.95) * math.sin(a)
        face = math.atan2(-cy, -cx)
        if chairs:
            ch = smooth(add("cylinder", (cx * 1.02, cy * 1.02, 0.3), radius=0.5, depth=0.6, vertices=48, material=M["chair"]), 0.04)
        px, py = (TR - 0.45) * math.cos(a), (TR - 0.45) * math.sin(a)
        add("cylinder", (px, py, 1.6), radius=0.3, depth=0.04, vertices=48, material=M["plate"])
        gx, gy = (TR - 0.4) * math.cos(a + 0.28), (TR - 0.4) * math.sin(a + 0.28)
        add("cylinder", (gx, gy, 1.75), radius=0.07, depth=0.3, vertices=32, material=M["glass"])
        figs.append(figure(cx * 1.02, cy * 1.02, ci, (0, 0), z0=0.6))
    return figs

def floor(size=400):
    add("plane", (0, 0, 0), (size, size, 1), material=M["floor"])

def lights(strength=1.0):
    bpy.ops.object.light_add(type="AREA", location=(4, -6, 9)); k = bpy.context.active_object
    k.data.energy = 2600 * strength; k.data.size = 9; k.rotation_euler = (math.radians(38), 0, math.radians(35))
    bpy.ops.object.light_add(type="AREA", location=(-7, 2, 6)); f = bpy.context.active_object
    f.data.energy = 800 * strength; f.data.size = 10; f.rotation_euler = (math.radians(60), 0, math.radians(-70))
    bpy.ops.object.light_add(type="AREA", location=(-2, 9, 7)); r = bpy.context.active_object
    r.data.energy = 900 * strength; r.data.size = 6; r.rotation_euler = (math.radians(-50), 0, math.radians(190))
    w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = hexcol("#f3fcef")
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

def dof(cam, target, fstop=5.6):
    cam.data.dof.use_dof = True; cam.data.dof.focus_object = target; cam.data.dof.aperture_fstop = fstop

def camera(loc, target, lens=34):
    bpy.ops.object.camera_add(location=loc); cam = bpy.context.active_object; scene.camera = cam; cam.data.lens = lens
    t = bpy.data.objects.new("target", None); t.location = target; scene.collection.objects.link(t)
    c = cam.constraints.new("TRACK_TO"); c.target = t; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    return cam, t

# ---------------- modes ----------------
floor(); lights()
anim = False
if MODE in ("hero", "still_hero", "social"):
    table_scene()
    rig = bpy.data.objects.new("rig", None); scene.collection.objects.link(rig)
    cam, t = camera((0, -10.2, 6.6), (0, 0.2, 1.4), 30)
    cam.parent = rig
    if MODE == "hero":
        bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
        anim = True; scene.frame_start, scene.frame_end = 1, 288          # 12 s at 24 fps, one full turn
        rig.rotation_euler = (0, 0, 0); rig.keyframe_insert("rotation_euler", frame=1)
        rig.rotation_euler = (0, 0, -2 * math.pi); rig.keyframe_insert("rotation_euler", frame=289)
        for fc in rig.animation_data.action.fcurves if hasattr(rig.animation_data.action, "fcurves") else []:
            for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
    if MODE == "social":
        cam.location = (0, -9.4, 7.6)
elif MODE == "topdown":
    table_scene(); camera((0, -0.01, 10.2), (0, 0, 1.2), 36)
elif MODE == "turkey":
    table_scene(); camera((3.2, -3.4, 3.6), (0, 0, 1.75), 52)
elif MODE == "track":
    anim = True
    for v in range(7):
        smooth(add("cube", (v * 1.15 - 3.45, 0, 0.18), (0.55, 0.55, 0.18), material=M["pol%d" % v]), 0.05)
    fam = figure(2.3, 0.3, 6, (-1, -4), z0=0.36, scale=0.9, name="family")
    you = figure(-1.15, 0, 2, (0, -5), z0=0.36, scale=0.9, name="you")
    scene.frame_start, scene.frame_end = 1, 144                              # 6 s at 24 fps, there and back
    for fr, x in ((1, -1.15), (36, -1.15), (72, 1.15), (108, 1.15), (144, -1.15)):
        you.location = (x, 0, 0.36); you.keyframe_insert("location", frame=fr)
    for fr, z in ((36, 0.36), (54, 0.95), (72, 0.36), (108, 0.36), (126, 0.95), (144, 0.36)):
        you.location.z = z; you.keyframe_insert("location", index=2, frame=fr)
    camera((0.6, -7.6, 4.2), (0.2, 0, 0.9), 40)
elif MODE == "question":
    figure(0, 0, 3, (0, -5), z0=0.0, scale=1.3)
    # question mark from a torus arc + bar + dot, in orange
    bpy.ops.mesh.primitive_torus_add(location=(0, 0, 4.7), major_radius=0.55, minor_radius=0.17, rotation=(math.radians(90), 0, 0))
    q = bpy.context.active_object; q.data.materials.append(M["orange"]); smooth(q)
    bm_cut = add("cube", (-0.45, 0, 4.35), (0.5, 0.5, 0.45), material=M["orange"])
    mod = q.modifiers.new("cut", "BOOLEAN"); mod.object = bm_cut; mod.operation = "DIFFERENCE"; bm_cut.hide_render = True
    smooth(add("cylinder", (0.0, 0, 3.9), radius=0.17, depth=0.5, material=M["orange"]))
    smooth(add("uv_sphere", (0, 0, 3.35), (0.2, 0.2, 0.2), material=M["orange"]))
    figure(-2.2, 0.6, 1, (0, 0), scale=1.0); figure(2.2, 0.6, 5, (0, 0), scale=1.0)
    camera((0, -10.5, 3.9), (0, 0, 2.4), 40)
elif MODE == "magnifier":
    table_scene(chairs=False, seats=[(120, 1), (200, 5), (300, 2), (20, 6)])
    g = bpy.data.objects.new("glass", None); scene.collection.objects.link(g); g.location = (0.4, -0.6, 3.6); g.rotation_euler = (math.radians(62), 0, math.radians(20))
    bpy.ops.mesh.primitive_torus_add(location=(0, 0, 0), major_radius=1.1, minor_radius=0.09); ring = bpy.context.active_object; ring.parent = g; ring.data.materials.append(M["ink"]); smooth(ring)
    lens = add("cylinder", (0, 0, 0), radius=1.08, depth=0.04, vertices=96, material=M["lens"], parent=g)
    hnd = smooth(add("cylinder", (0, -1.75, 0), (1, 1, 1), radius=0.12, depth=1.3, material=M["ink"], parent=g)); hnd.rotation_euler = (math.radians(90), 0, 0)
    camera((2.0, -7.2, 7.4), (0.2, 0, 1.8), 36)

elif MODE == "scroll":
    table_scene()
    rig = bpy.data.objects.new("rig", None); scene.collection.objects.link(rig)
    cam, t = camera((0, -10.2, 6.6), (0, 0.2, 1.4), 30); cam.parent = rig; t.parent = None; dof(cam, t, 8)
    anim = True; scene.frame_start, scene.frame_end = 1, 72
    rig.rotation_euler = (0, 0, 0); rig.keyframe_insert("rotation_euler", frame=1)
    rig.rotation_euler = (0, 0, math.radians(-110)); rig.keyframe_insert("rotation_euler", frame=72)
    cam.location = (0, -10.2, 6.6); cam.keyframe_insert("location", frame=1)
    cam.location = (0, -5.6, 3.9); cam.keyframe_insert("location", frame=72)
    t.location = (0, 0.2, 1.4); t.keyframe_insert("location", frame=1)
    t.location = (0, 0, 1.85); t.keyframe_insert("location", frame=72)
elif MODE.startswith("calc_"):
    # calculator stage and figure layers, all from the same camera; figure layers are transparent with a shadow catcher
    part = MODE.split("_")[1]
    cam, t = camera((0, -11.5, 4.6), (0, 0, 1.6), 40)
    if part == "stage":
        table_scene(chairs=False, seats=[(60, 3), (120, 3)])
        for o in list(scene.objects):
            if o.name.startswith("fig"): o.hide_render = True
            for ch in o.children_recursive if hasattr(o, "children_recursive") else []:
                if o.name.startswith("fig"): ch.hide_render = True
        for o in scene.objects:
            if o.parent and o.parent.name.startswith("fig"): o.hide_render = True
        for o in scene.objects:
            if o.type == "MESH" and o.location.y != 0: pass
    else:
        ci = int(MODE.split("_")[2])
        for o in list(scene.objects):
            if o.type == "MESH" and o.data.materials and o.data.materials[0].name == "floor": o.is_shadow_catcher = True
        if part == "you": figure(-2.6, -2.2, ci, (0, -11), z0=0.0, scale=1.05, name="you")
        else: figure(2.6, -2.2, ci, (0, -11), z0=0.0, scale=1.05, name="family")
        scene.render.film_transparent = True
elif MODE == "leopard":
    import random; random.seed(7)
    def on_ellipsoid(c, r, az, el, inset=0.985):
        # point on an ellipsoid surface (az around z, 180 deg = facing the camera at -x)
        return (c[0] + inset * r[0] * math.cos(el) * math.cos(az), c[1] + inset * r[1] * math.cos(el) * math.sin(az), c[2] + inset * r[2] * math.sin(el))
    BC, BR = (0, 0, 0.95), (0.62, 0.56, 0.95)
    HC, HR = (0, 0, 2.3), (0.7, 0.66, 0.6)
    smooth(add("uv_sphere", BC, BR, segments=64, ring_count=32, material=M["snow"]))
    smooth(add("uv_sphere", HC, HR, segments=64, ring_count=32, material=M["snow"]))
    smooth(add("uv_sphere", (-0.52, 0, 2.08), (0.26, 0.36, 0.2), segments=48, ring_count=24, material=M["snow"]))   # muzzle
    for s in (-1, 1):
        ear = smooth(add("uv_sphere", (0.05, 0.47 * s, 2.82), (0.12, 0.2, 0.22), material=M["snow"])); ear.rotation_euler = (0.3 * s, 0, 0)
        smooth(add("uv_sphere", (-0.03, 0.47 * s, 2.82), (0.06, 0.12, 0.14), material=M["spot"]))
        smooth(add("uv_sphere", (-0.5, 0.27 * s, 2.4), (0.17, 0.2, 0.21), segments=48, ring_count=24, material=M["eyeL"]))
        smooth(add("uv_sphere", (-0.66, 0.24 * s, 2.48), (0.04, 0.04, 0.04), material=M["hi"]))
        smooth(add("uv_sphere", (-0.66, 0.31 * s, 2.36), (0.018, 0.018, 0.018), material=M["hi"]))
    smooth(add("uv_sphere", (-0.76, 0, 2.15), (0.06, 0.1, 0.07), material=M["nose"]))
    for k in range(26):     # forehead freckles
        az = math.radians(180 + random.uniform(-38, 38)); el = math.radians(random.uniform(28, 62))
        smooth(add("uv_sphere", on_ellipsoid(HC, HR, az, el), (0.028, 0.028, 0.028), segments=12, ring_count=8, material=M["spot"]))
    for k in range(60):     # rosettes on the body, front half only
        az = math.radians(180 + random.uniform(-62, 62)); el = math.radians(random.uniform(-50, 45))
        r = random.uniform(0.04, 0.065)
        smooth(add("uv_sphere", on_ellipsoid(BC, BR, az, el, 0.955), (r * 0.8, r * 1.2, r), segments=16, ring_count=8, material=M["spot"]))
    # raised paw with toe beans, held up towards the camera
    smooth(add("uv_sphere", (-0.62, 0.16, 1.25), (0.2, 0.2, 0.5), segments=32, ring_count=16, material=M["snow"]))
    smooth(add("uv_sphere", (-0.8, 0.16, 1.72), (0.22, 0.3, 0.33), segments=48, ring_count=24, material=M["snow"]))
    smooth(add("uv_sphere", (-1.0, 0.16, 1.64), (0.05, 0.15, 0.12), material=M["bean"]))
    for dy, dz in ((-0.18, 1.85), (-0.065, 1.94), (0.065, 1.94), (0.18, 1.85)):
        smooth(add("uv_sphere", (-1.0, 0.16 + dy, dz), (0.035, 0.055, 0.065), material=M["bean"]))
    for o in list(scene.objects):
        if o.type == "MESH" and o.data.materials and o.data.materials[0].name == "floor": o.is_shadow_catcher = True
    scene.render.film_transparent = True
    cam, t = camera((-7.2, 0.3, 2.2), (0, 0, 1.75), 78)

# ---------------- render ----------------
eng = ENGINE
if eng == "EEVEE":
    for cand in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try: scene.render.engine = cand; break
        except Exception: pass
    try:
        scene.eevee.taa_render_samples = SAMPLES
        scene.eevee.use_shadows = True
        scene.eevee.use_raytracing = True
    except Exception as ex: print("eevee settings:", ex)
else:
    scene.render.engine = "CYCLES"; scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True
    try:
        p = bpy.context.preferences.addons["cycles"].preferences; p.compute_device_type = "METAL"; p.get_devices()
        for d in p.devices: d.use = True
        scene.cycles.device = "GPU"
    except Exception as ex: print("GPU:", ex)
scene.view_settings.view_transform = "AgX"
scene.view_settings.exposure = 0.55
scene.render.resolution_x, scene.render.resolution_y = RW, RH
scene.render.image_settings.file_format = "PNG"
scene.render.fps = 24
scene.render.filepath = OUT
if anim:
    bpy.ops.render.render(animation=True)
else:
    bpy.ops.render.render(write_still=True)
print("DONE", MODE, OUT)
