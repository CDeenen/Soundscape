# Introduction
<b>This module only works in Foundry 0.8. It will not be made backwards compatible with Foundry 0.7, since it relies on a lot of the new audio features of 0.8</b><br>
<b>Please note that this module is still in its infancy. There are still multiple bugs, and you should consider it being in beta.</b><br>
<br>
Soundscape is a Foundry VTT module that gives users an easy way to mix down multiple audio tracks into a single highly configurable soundscape. The individual volumes of the sounds can be changed on the fly, 
and multiple effects can be applied to the sounds in order to create the perfect soundscape. Besides that, there is a built-in soundboard that can be 
used for short sound effects, such as weapon or spell attack sounds.<br>
<br>
Multiple soundscapes, each with their own sounds and soundboard, can be set up, 
and navigated through. There is also the option to import and export the soundscapes, either for backup, or for sharing them with your friends. (no 
actual audio files are imported/exported, only the metadata).
<br>
Future plans are to allow <a href="https://github.com/cdeenen/materialdeck">Material Deck</a> and <a href="https://github.com/cdeenen/materialkeys">Material Keys</a> to control Soundscape through
an <a href="https://www.elgato.com/en/stream-deck">Elgato Stream Deck</a> or <a href="https://novationmusic.com/en/launch/launchpad-mini">Novation Launchpad Mini</a>, respectively.<br>       
Additionally, I want to add support for hardware MIDI controllers, such as the <a href="https://www.behringer.com/product.html?modelCode=P0B1X">Behringer X-Touch</a>, 
<a href="https://mackie.com/products/mcu-pro-and-xt-pro-control-surfaces">Mackie Control Surfaces</a>, or much cheaper (non-motorized) fader controllers such as the 
<a href="https://www.korg.com/us/products/computergear/nanokontrol2/">Korg nanoKontrol</a>. I have been experimenting with DIY motorized faders in order to create an extension for a
Stream Deck, where the Stream Deck would be used to control the mute, solo and link buttons, and the soundboard, while the faders would be used to control the volumes. You can see an 
early demonstration of this in <a href="https://youtu.be/I8maolIlqxM">this video</a>.<br>
<br>
While this readme contains the full documentation, each screen in the module has its own help button at the top-right (next to the close button). Pressing this will open a new screen containing instructions on that specific screen.

<h1>Mixer</h1>
At the top there are the following buttons and fields, from left to right:
<ul>
    <li><b>Previous Soundscape</b>: Pressing this button will load the previous soundscape</li>
    <li><b>Next Soundscape</b>: Pressing this button will load the next soundscape</li>
    <li><b>Soundscape Name</b>: The name of this soundscape. This can be edited by typing in a new name</li>
    <li><b>Soundscape Configuration</b>: Opens the soundscape configuration, see below</li>
    <li><b>Open/Close Soundboard</b>: Pressing this will expand the mixer to include a soundboard. More on that below</li>
</ul>
The center of the mixer is divided into 9 columns, where the right-most column controls the master volume, and the other columns control a channel. Each channel can play back a single audio track, so in total you can have 8 audio tracks playing.<br>
For each of these channels, there are various buttons and sliders. From the top to the bottom:
<ul>
    <li><b>Sound Configuration</b>: Pressing this button opens the sound configuration, where you can select the audio file and set timing options.</li>
    <li><b>Pan</b>: A horizontal slider that can be used to pan the sound to the right or the left. There is a center 'indent', so you can easily find the center. For fine-tuning, the scroll wheel can be used.</li>
    <li><b>Fx</b>: Pressing this buttons opens the effects configuration, where you can configure an equalizer, the playback speed, and a delay.</li>
    <li><b>Mute</b>: Mutes the channel</li>
    <li><b>Solo</b>: Solos the channel (mutes all channels that are not solo'd)</li>
    <li><b>Link</b>: All channels with link enabled, will link their volumes together. So you can move multiple volume sliders at once. Relative volumes are maintained.</li>
    <li><b>Volume</b>: Sets the volume of the sound. You can either drag the slider, or edit the number below it. A volume of 100 means that there is no amplification or attenuation, a volume of 0 means it is silent.</li>
    <li><b>Name</b>: Name of the channel</li>
    <li><b>Start/Stop Channel</b>: Starts or stops the audio for that channel</li>
</ul>

At the bottom there's a big start/stop button, which will start or stop all sounds at the same time.<br>
<br>
All the channel volume controls work independently (if 'Link' is not enabled). The volume is relative to the master volume, which is controlled by the right-most slider. So changing the master volume will
change the volume of all sounds. The master volume can be set for each soundscape individually. Under the global volume controls (in the sidebar under the 'Audio Playlists' tab) there's a 'Soundscape' slider 
that will control the volume of everything. It is independent of the channel or master volumes of the soundscapes.<br>
<br>
When loading a new soundscape, it might take a few seconds for all the sounds to be loaded. By looking at the 'Start/Stop Channel' button you can see if the sounds have been loaded, as it will no longer be disabled.
Pressing a 'Start/Stop Channel' button when the sound is still loading will not work. Pressing the big 'Start/Stop All' button while some sounds are not yet loaded will result in those sounds not playing.


<h2>Sound Configuration</h2>
In this menu you can configure the sound for each channel. You have the following options, some of which are not always visible (depending on what is set at 'Sound Selection'):
<ul>
    <li><b>Name</b>: The name of the channel. This will be displayed at the bottom of the mixer</li>
    <li><b>Sound Selection</b>: Configures how you want to select the sound:
        <ul>
            <li><b>Playlist: Single Sound</b>: Select a single sound from a playlist</li>
            <li><b>Playlist: Complete Playlist</b>: Select a complete playlist. Will play all sounds in the playlist consecutively</li>
            <li><b>Filepicker: Single Sound</b>: Select a single sound using the file picker, wildcard names are allowd to select multiple sounds</li>
            <li><b>Filepicker: Folder</b>: Select a folder. Will play all sounds in the folder consecutively</li>
        </ul>
    </li>
    <li><b>Playlist</b>: (Visible if 'Sound Selection' is set to one of the playlist options) The playlist from which to select a sound</li>
    <li><b>Sound (playlist)</b>: (If 'Sound Selection' is set to 'Playlist: Single Sound') Selects the sound to play from the selected playlist</li>
    <li><b>Sound (filepicker)</b>: (If 'Sound Selection' is set to 'Filepicker: Single Sound') Shows the path to the selected sound. Press the button on the right to open the filepicker</li>
    <li><b>Folder</b>: (Visible if 'Sound Selection' is set to 'Filepicker: Folder') Shows the path to the selected folder. Press the button on the right to open the filepicker</li>
    <li><b>Shuffle</b>: (Visible if 'Sound Selection' is NOT set to 'Playlist: Single Sound') Enabling this will shuffle the sounds in the playlist, folder, or wildcard list</li>
    <li><b>Repeat</b>: Sets whether the sound or selection of sounds should repeat after it is finished playing
        <ul>
            <li><b>Don't Repeat</b>: Don't repeat the sounds</li>
            <li><b>Repeat Single</b>: Repeat a single sound</li>
            <li><b>Repeat All</b>: Will play all sounds in the playlist, folder or wildcard list, and will repeat that</li>
        </ul>
    </li>
    <li><b>Start</b>: The time at which you want to start playback in HH:MM:SS:mm (where 'mm' is millisecons)</li>
    <li><b>Stop</b>: The time at which you want to stop playback in HH:MM:SS:mm (where 'mm' is millisecons)</li>
    <li><b>Duration</b>: The duration of the sound (not editable)</li>
    <li><b>Fade In</b>: The fade in duraction in HH:MM:SS:mm (where 'mm' is millisecons)</li>
    <li><b>Fade Out</b>: The fade out duraction in HH:MM:SS:mm (where 'mm' is millisecons)</li>
</ul>
<h3><b>Wildcard Names</b></h3>
When selecting single sounds using the filepicker, you can use wildcard names so it will randomly play a sound from a selection. To do this, navigate to the folder that contains the sounds, 
in the textbox append the filename with the common part of the name of the sounds you want to play, followed by an asterisk.
For example, if you have the sounds 'Thunder.wav', 'Thunder2.wav' and 'Thunder3.wav' in the folder 'Assets', you could fill in the following: 'Assets/Thunder*', 
which will play one of the three sounds randomly when you press the button.

<h2>Effects Configuration</h2>
In this screen you can set up effects for the channel. This screen has 3 parts: A spectrum analyzer, equalizer, and other effects.<br>

<h3><b>Spectrum Analyzer</b></h3>
A spectrum analyzer gives an overview of what frequencies are in the sound (if it is playing). The frequency is on the horizontal axis, while the intensity is on the vertical axis. The main use for it in this case is to
visualize the effect of the equalizer and playback rate.

<h3><b>Equalizer</b></h3>
An equalizer is used to shape sound by either amplifying or attenuating certain parts of the audio spectrum. Soundscape has 4 equalizer filters, of which 2 are identical peak filters.<br>
<ul>
    <li><b>High Pass Filter</b>: A high pass filter will attenuate the low frequencies, while letting high frequencies through</li>
    <li><b>Low Pass Filter</b>: The opposite of a high pass filter. It will attenuate the high frequencies, while letting low frequencies through</li>
    <li><b>Peak Filter</b>: A peak filter will either amplify or attenuate a narrow section of the audio spectrum</li>
</ul>
The filters have the following options:
<ul>
    <li><b>Enable</b>: Enables the filter</li>
    <li><b>Frequency</b>: Sets the frequency in Hz at which the filter operates</li>
    <li><b>Q-Factor</b>: Sets the bandwidth of the filter, which, in simple terms, sets how sharp the filter response is. A lower Q-Factor results in a wider bandwidth, and thus the filter will affect more frequencies</li>
    <li><b>Gain</b>: Sets the gain of the peaking filter, which determines how much the sound should be amplified or attenuated in the filter region</li>
</ul>
If the filters are enabled, a red line is drawn over the spectrum analyzer to indicate how the sound is shaped by the filters.

<h3><b>Other Effects</b></h3>
In this section there are 2 more effects:<br>
<br>

<h4><b>Playback Rate</b></h4>
You can set the playback rate of the sound, which will either slow down or speed up the playback.<br>
A rate of 1 means that it the sound is played back at normal speed, while a rate of 2 means it is played back at double speed.<br>
Please note that this setting also changes the pitch of the sound.<br>
<br>
<h4><b>Delay</b></h4>
Lastly there is the delay effect.<br>
The delay takes a copy of the sound, and plays it back together with the original sound, but with a slight delay. You can set the delay time with the 'Delay' slider, 
and the volume of the delayed sound with the 'Delay Volume' slider.

<h1>Soundboard</h1>
The soundboard allows you to play single sounds. This is best used for short sound effects, such as thunder or melee hit sounds. You can access the soundboard by pressing the right-most button in the mixer, with the 
music note icon. This will expand the mixer, adding the soundboard to the right. Each soundscape has its own soundboard.<br>
<br>
You can have up to 25 sounds per soundscape. You can configure the sounds by pressing the textbox below the big buttons. This will open a new dialog.<br>
By pressing the big buttons, the configured sound will play.<br>
The volume for each sound is set in the configuration, while the volume slider at the bottom sets the volume for the whole soundboard.<br>
You can stop all currently playing sounds by pressing the 'Stop All' button.<br>
<br>
By dragging an existing sound onto another button, the sound and all its settings will be moved to the new button. If the new button already contained a sound,
the sounds will be swapped. If Ctrl is pressed during the start of the movement, the sound will be copied to the new button.<br>
You can delete sounds by dragging them onto the trash icon at the top-right.

<h2>Soundboard Configuration</h2>
In this menu you can configure the sound for each soundboard button. You have the following options, some of which are not always visible (depending on what is set at 'Sound Selection'):
<ul>
    <li><b>Name</b>: The name of the sound. This will be displayed below the button on the soundboard</li>
    <li><b>Sound Selection</b>: Configures how you want to select the sound:
        <ul>
            <li><b>Playlist: Single Sound</b>: Select a single sound from a playlist</li>
            <li><b>Playlist: Complete Playlist</b>: Select a complete playlist. Will play all sounds in the playlist consecutively</li>
            <li><b>Filepicker: Single Sound</b>: Select a single sound using the file picker, wildcard names are allowd to select multiple sounds</li>
            <li><b>Filepicker: Folder</b>: Select a folder. Will play all sounds in the folder consecutively</li>
        </ul>
    </li>
    <li><b>Playlist</b>: (Visible if 'Sound Selection' is set to one of the playlist options) The playlist from which to select a sound</li>
    <li><b>Sound (playlist)</b>: (If 'Sound Selection' is set to 'Playlist: Single Sound') Selects the sound to play from the selected playlist</li>
    <li><b>Sound (filepicker)</b>: (If 'Sound Selection' is set to 'Filepicker: Single Sound') Shows the path to the selected sound. Press the button on the right to open the filepicker</li>
    <li><b>Folder</b>: (Visible if 'Sound Selection' is set to 'Filepicker: Folder') Shows the path to the selected folder. Press the button on the right to open the filepicker</li>
    <li><b>Shuffle</b>: (Visible if 'Sound Selection' is NOT set to 'Playlist: Single Sound') Enabling this will shuffle the sounds in the playlist, folder, or wildcard list</li>
    
    <li><b>Volume</b>: Sets the volume of the sound</li>
    <li><b>Playback Speed</b>: Set the playback speed of the sound. Please note that the pitch also changes. A value of 1 means normal playback speed, a value of 2 means double playback speed</li>
    <li><b>Randomize Speed</b>: If you set a value higher than 0 here, a random value will be picked between -value and +value, which is added to the playback speed. 
        This allows for some variation in the sound</li>
</ul>
<h3><b>Wildcard Names</b></h3>
When selecting single sounds using the filepicker, you can use wildcard names so it will randomly play a sound from a selection.<br>
To do this, navigate to the folder that contains the sounds, in the textbox append the filename with the common part of the name of the sounds you want to play, followed by an asterisk.<br>
For example, if you have the sounds 'Thunder.wav', 'Thunder2.wav' and 'Thunder3.wav' in the folder 'Assets', you could fill in the following: 'Assets/Thunder*', 
which will play one of the three sounds randomly when you press the button.

<h1>Soundscape Configuration</h1>
In this screen you can manage your soundscapes. You will find a list of all the stored soundscapes.<br>
Each soundscape has multiple buttons:
<ul>
    <li><b>Load</b>: This will load the soundscape into the mixer</li>
    <li><b>Move Down</b>: Moves the soundscape one position down</li>
    <li><b>Move Up</b>: Moves the soundscape one position up</li>
    <li><b>Copy Soundboard to Selected</b>: Copies the soundboard from this soundscape to all soundscapes with 'select' ticked</li>
    <li><b>Select</b>: Used to select which soundscapes to target for various actions</li>
</ul>
At the bottom you will find the multiple buttons. Whenever 'selected soundscapes' are mentioned, this means that it applies to the soundscapes with 'select' ticked.
<ul>
    <li><b>Select All</b>: Selects all soundscapes</li>
    <li><b>Deselect All</b>: Deselects all soundscapes</li>
    <li><b>Add Soundscape</b>: Adds a new soundscape to the bottom of the list</li>
    <li><b>Duplicate Selected</b>: Duplicates all selected soundscapes to the bottom of the list</li>
    <li><b>Delete Selected</b>: Deletes the selected soundscapes</li>
    <li><b>Export Selected</b>: Exports the selected soundscapes to a file, see below</li>
    <li><b>Import</b>: Imports soundsboards from a file and adds them to the bottom of the list, see below</li>
</ul>
<h2>Importing and Exporting Soundscapes</h2>
Importing and exporting allows you to save soundscapes, or share them with friends. There is one important caveat:<br>
Only the metadata of the sounds is exported/imported.<br>
This means that when you import a file, you need to have all the sound files in the same relative location as when it was exported.<br>
For example, if you export a soundscape that uses sounds from a specific playlist, when you import the soundscape you need to have the exact same playlist and sounds set up in Foundry. 
For files picked with the file picker, the relative location must be the same. So if you have a file at location 'Data/Assets/Thunder.mp3', when you import the soundscape, you must have a 
file named 'Thunder.mp3' in the folder Data/Assets.

<h2>Feedback</h2>
If you have any suggestions or bugs to report, feel free to create an issue, contact me on Discord (Cris#6864), or send me an email: cdeenen@outlook.com.

<h2>Credits</h2>
<b>Author:</b> Cristian Deenen (Cris#6864 on Discord)<br>
<br>
Special thanks to Asmodeus#7588 who made this module possible by generously donating a Stream Deck XL
<br>
Please consider supporting me on <a href="https://www.patreon.com/materialfoundry">Patreon</a>, and feel free to join the Material Foundry <a href="https://discord.gg/3hd4G6TkmA">Discord</a> server.

<h2>Abandonment</h2>
Abandoned modules are a (potential) problem for Foundry, because users and/or other modules might rely on abandoned modules, which might break in future Foundry updates.<br>
I consider this module abandoned if all of the below cases apply:
<ul>
  <li>This module/github page has not received any updates in at least 3 months</li>
  <li>I have not posted anything on "the Foundry", "the League of Extraordinary Foundry VTT Developers" or the "Material Foundry" Discord servers in at least 3 months</li>
  <li>I have not responded to emails or PMs on Discord in at least 1 month</li>
  <li>I have not announced a temporary break from development, unless the announced end date of this break has been passed by at least 3 months</li>
</ul>
If the above cases apply (as judged by the "League of Extraordinary Foundry VTT Developers" admins), I give permission to the "League of Extraordinary Foundry VTT Developers" admins to assign one or more developers to take over this module, including requesting the Foundry team to reassign the module to the new developer(s).<br>
I require the "League of Extraordinary Foundry VTT Developers" admins to send me an email 2 weeks before the reassignment takes place, to give me one last chance to prevent the reassignment.<br>
I require to be credited for my work in all future releases.