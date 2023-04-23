# Changelog
### v1.1.0 - 23-04-2023
A big thanks to SvenWerlen (known from Moulinette) for picking this up and fixing some issues and adding new features.

Additions:
<ul>
<li>Should now work on the Forge (thanks to @SvenWerlen)</li>
<li>Moulinette integration (thanks to @SvenWerlen)</li>
<li>Reset/delete channels (thanks to @SvenWerlen)</li>
<li>Option to play sounds (from the soundboard) to specific players (thanks to @SvenWerlen)</li>
<li>Assigning a soundscape to a scene or combat now stops the soundscape when another scene is activated</li>
<li>A player can now be assigned to control soundscape instead of the gamemaster</li>
</ul>

Fixes:
<ul>
<li>Fixed compatibility issues with Foundry V10 (thanks to @SvenWerlen)</li>
<li>Drag & drop now works on Firefox (thanks to @SvenWerlen)</li>
<li>Combat soundscapes assigned to a scene now properly load when that scene has active combat</li>
<li>Core Foundry drag & drop functionality should no longer be broken by Soundscape</li>
</ul>

### v1.0.3 - 01-09-2021

Additions:
<ul>
<li>Added support for controlling Soundscape through other modules or macros</li>
<li>(Potentially) fixed compatibility with Playlist Enhancer</li>
<li>Added repeat option for the soundboard, this is indicated by a yellow (not playing) or green (playing) shadow around the button</li>
<li>Repeat for both the soundboard and the mixer now has a configurable delay</li>
<li>Added option to randomize the volume for the soundboard</li>
<li>Added 'Apply start timing after first loop' and 'Apply fade in after first loop' to the sound configuration screen. Enabling these will ignore the start timing or fade in when a sound is looped (due to the repeat function) for the first time</li>
<li>Added option to autostart a soundscape on scene load or when combat starts. Both are configured in the scene configuration under 'Ambience and Atmosphere'.</li>
</ul>

Fixes:
<ul>
<li>Fixed the import function</li>
<li>Randomizing a playlist or folder did not work</li>
<li>Fixed CSS issues with Firefox</li>
<li>Fade in didn't always work, it should be more reliable now</li>
</ul>

### v1.0.2 - 14-07-2021
-Playlists and playlist sounds can not be dragged into the mixer to populare the soundboard or a channel
-Forgot to fix capitalization issues for the soundboard config, which prevented it from opening
-Soundscape name edits resulted in an error

### v1.0.1 - 14-07-2021
Fixed some capitalization issues, which prevented dialogs from opening

### v1.0.0 - 14-07-2021
Initial release<br>
