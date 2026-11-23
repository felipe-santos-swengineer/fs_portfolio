import subprocess
from pathlib import Path
import imageio_ffmpeg

ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
root=Path('src/assets/audio/dragon')
for lang in ('pt','en'):
    for number in range(2,5):
        source=root/f'{lang}-{number}.mp3'
        target=root/f'{lang}-{number}-elder.mp3'
        # The accusation about the gold is rougher.
        tremolo='0.27' if number==2 else '0.16'
        # A low, textured voice mixed with a little original speech for clarity.
        filters=('[0:a]asplit=2[base][low];'
                 '[base]volume=0.22[clear];'
                 '[low]asetrate=24000*0.72,aresample=24000,atempo=1.38889,'
                 f'lowpass=f=4800,tremolo=f=24:d={tremolo},volume=1.15[deep];'
                 '[clear][deep]amix=inputs=2:duration=longest:normalize=0,'
                 'aecho=0.8:0.75:85:0.12,alimiter=limit=0.92[out]')
        subprocess.run([ffmpeg,'-y','-v','error','-i',str(source),'-filter_complex',filters,'-map','[out]','-codec:a','libmp3lame','-b:a','64k',str(target)],check=True)
        print(target)
