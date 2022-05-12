import bpy
import os
import glob

import pathlib

targetPattern = r"/home/nu/repo/bc/docs/model/*.blend"
mypath = pathlib.Path(".")
for fname in mypath.iterdir():
    if(fname.suffix != ".blend"):continue
    fullpath = str(fname.resolve())
    print(fullpath)
    bpy.ops.wm.open_mainfile(filepath=fullpath)
    fullpath = str(fname.with_suffix(".o3o").resolve())
    bpy.ops.export_scene.o3o(filepath=fullpath)
