import React from 'react';

// These illustrations follow the palette and landmarks of the playable maps.
export default function PortalArtwork({ scene }) {
  const skies={lake:['#b6d8d2','#e1e5c9'],rapids:['#a4ceca','#d6e3cf'],ruins:['#b0d1c9','#e1e0c8'],passage:['#172a2d','#4a3a2a'],temple:['#172a2d','#52695d'],cave:['#101919','#34483c'],chamber:['#171812','#4b4738'],corridor:['#0d0c12','#33303c'],guardian:['#1c1a24','#383444']};
  const [top,bottom]=skies[scene];
  return <svg className="portal-card-image" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs><linearGradient id={`sky-${scene}`} x2="0" y2="1"><stop stopColor={top}/><stop offset="1" stopColor={bottom}/></linearGradient><linearGradient id={`water-${scene}`} x2="0" y2="1"><stop stopColor="#80c8c5"/><stop offset="1" stopColor="#397f83"/></linearGradient><radialGradient id={`glow-${scene}`}><stop stopColor="#f8c777" stopOpacity=".65"/><stop offset="1" stopColor="#f8c777" stopOpacity="0"/></radialGradient></defs>
    <rect width="600" height="250" fill={`url(#sky-${scene})`}/>
    {scene==='lake'&&<>
      <path d="M0 112 70 71 127 106 194 57 254 108 330 63 397 99 475 54 555 103 600 80v93H0Z" fill="#718d7b"/><path d="M0 139 58 99l74 28 54-44 75 47 77-35 77 39 76-45 109 46v40H0Z" fill="#547d6d"/>
      <path d="M194 116 219 58 366 58 395 116 371 155H225Z" fill="#626f63"/><path d="M232 76h120l14 68H219Z" fill="#27403c"/><path d="M244 75h96l10 77H232Z" fill="#b6e0d9" opacity=".9"/><path d="M253 79q-5 35-9 70m27-70q3 40-5 72m28-74q-6 35-4 74m29-71q-3 35 2 73m13-72q3 41 5 70" fill="none" stroke="#eef6e8" strokeWidth="4" opacity=".7"/>
      <path d="M0 150q100-17 204 4t200 0 196-8v104H0Z" fill={`url(#water-${scene})`}/><path d="M0 183q85-8 174 0m116 16q95-12 177 0m-328 25q102-10 191 0m150-41q59-8 120-1" fill="none" stroke="#c2e6dc" strokeWidth="3" opacity=".65"/>
      <path d="M0 147h141l23 11H0m600-11H460l-18 11h158" fill="#506d51"/><path d="M34 153h99l14 6H34m-1-5v-20m38 20v-20m42 20v-20m-80 4h98" fill="none" stroke="#785a40" strokeWidth="5"/>
      <path d="M250 200h100l-15 14h-68Z" fill="#694c36"/><path d="M299 202v-37m-1 3-18 24h18" fill="#e8dbb9" stroke="#6b5139" strokeWidth="3"/><circle cx="300" cy="197" r="5" fill="#c9a37a"/><path d="M0 110l19-41 19 41m-10 0v33m518-38 18-38 20 38m-20 0v36" fill="#355947" stroke="#355947" strokeWidth="4"/>
    </>}
    {scene==='rapids'&&<>
      <path d="M0 0h180l34 250H0Z" fill="#6b7c70"/><path d="M600 0H420l-34 250h214Z" fill="#697a70"/><path d="m0 20 65-20 86 30 20 54-66 15-105-9m600-55-76-35-74 28-25 55 65 15 110-13" fill="#839388"/><path d="M166 0h268l-45 250H211Z" fill={`url(#water-${scene})`}/><path d="M171 19 214 250h20L191 19m218 0-43 231h19L429 19" fill="#d8eee0" opacity=".65"/>
      <path d="M214 46q35-12 70 0t70 0 50 0M220 90q42-16 80 0t80 0M233 147q37-15 72 0t62 0M221 218q75-23 156 0" fill="none" stroke="#ddf4e9" strokeWidth="5" opacity=".8"/>
      <path d="m228 162 16-19 16 19Zm130-71 15-20 17 20Zm-44 88 15-13 17 13Z" fill="#6d7b70"/><path d="M264 202h72l-10 20h-51Z" fill="#73513a" stroke="#4e3c30" strokeWidth="3"/><circle cx="299" cy="192" r="8" fill="#c6a17e"/><path d="M299 200v-28m0 0 24 18h-24" fill="#ebdec0" stroke="#66503b" strokeWidth="3"/><path d="m21 178 61-44 65 22-10 48H0m600-33-59-35-71 21 9 49h121" fill="#596c61"/>
    </>}
    {scene==='ruins'&&<>
      <path d="M0 114 85 67 144 97 213 47 289 100 365 60 438 98 526 48 600 105v74H0Z" fill="#729181"/><path d="M0 141q100-22 200-5t200 3 200-5v116H0Z" fill={`url(#water-${scene})`}/><path d="M91 168q70-37 130-20l46 22 104 1q69-29 147 0l-10 27H92Z" fill="#7f8e72"/>
      <path d="M203 165v-46a68 68 0 0 1 136 0v46h-18v-46a50 50 0 0 0-100 0v46Z" fill="#a5a994"/><path d="M194 165v-48a76 76 0 0 1 152 0v48" fill="none" stroke="#737e70" strokeWidth="8"/><path d="M109 169v-65h22v65m-27-65h32m-32-12h32m303 77v-65h22v65m-27-65h32m-32-12h32" fill="#aab19c" stroke="#777f70" strokeWidth="4"/>
      <path d="M155 176h94l-13 13h-67Z" fill="#73513b"/><circle cx="202" cy="171" r="6" fill="#c39d7f"/><path d="M402 162v-29m-10 29h21" stroke="#775643" strokeWidth="5"/><path d="M387 137q15-24 30 0Z" fill="#536b58"/><path d="M0 215q70-12 140 0t140 0 140 0 180 0" fill="none" stroke="#c3e2d5" strokeWidth="4" opacity=".7"/>
    </>}
    {scene==='passage'&&<>
      <path d="M0 0h600v250H0Z" fill="#142224"/><path d="M0 0 168 62v126L0 250Zm600 0-168 62v126l168 62Z" fill="#39423d"/>
      <path d="M168 62q132-58 264 0v126H168Z" fill="#4d5348"/><path d="M206 188V112a94 94 0 0 1 188 0v76Z" fill="#111d1d"/>
      <path d="M0 250 156 168h288l156 82Z" fill="#3a3d35"/><path d="M246 250h108l-16-24h-76Z" fill="#2a2721"/>
      <path d="M300 226v-37m0 0 26 20h-26" fill="#e8dbb9" stroke="#6b5139" strokeWidth="3"/><circle cx="300" cy="219" r="6" fill="#c6a17e"/>
      <path d="m210 118 12 20-12 20m180-40-12 20 12 20" fill="none" stroke="#d9a15c" strokeWidth="5" strokeLinecap="round"/><circle cx="222" cy="138" r="30" fill={`url(#glow-${scene})`}/><circle cx="378" cy="138" r="30" fill={`url(#glow-${scene})`}/>
      <path d="M0 214q75-16 150 0t150 0 150 0 150 0" fill="none" stroke="#9fb8a5" strokeWidth="4" opacity=".55"/>
    </>}
    {scene==='temple'&&<>
      <circle cx="467" cy="42" r="20" fill="#d5d0ac"/><path d="M0 139 75 91 146 120 222 55 300 113 385 67 459 114 531 72 600 115v135H0Z" fill="#394f45"/><path d="M0 178q113-34 225-8t191-2 184-4v86H0Z" fill="#697e5d"/><path d="M247 250 279 151h42l31 99Z" fill="#a88e6b"/>
      <path d="M208 147V96h184v51h-18v-42H226v42Z" fill="#a7a38b"/><path d="m196 97 104-43 104 43Z" fill="#858873"/><path d="M232 144v-39m29 39v-39m28 39v-39m28 39v-39m28 39v-39m28 39v-39" stroke="#d2c8a9" strokeWidth="8"/><path d="M274 145v-19a26 26 0 0 1 52 0v19Z" fill="#303d33"/><path d="M262 77q37-34 76 0l-19-6-19 9-19-9Z" fill="#354c3e"/>
      <path d="M38 177v-39l41-29 41 29v39Zm442 0v-39l41-29 41 29v39Z" fill="#9c8d70"/><path d="m29 138 50-38 50 38m342 0 50-38 50 38" fill="none" stroke="#5c4d3c" strokeWidth="10"/><path d="M68 177v-25h20v25m423 0v-25h20v25" fill="#392e29"/><circle cx="149" cy="173" r="22" fill={`url(#glow-${scene})`}/><path d="m149 166-5 9h10Z" fill="#f0a753"/>
    </>}
    {scene==='cave'&&<>
      <path d="M0 0h600v48l-48 14-24-20-28 32-35-27-41 19-32-26-40 18-35-32-38 37-30-25-33 26-29-23-43 28-36-24-31 21-37-20-40 18Z" fill="#536254"/><path d="M0 64 88 39l69 47-13 164H0m600-185-90-25-66 45 11 165h145" fill="#34473c"/><path d="M98 250 203 80l96-33 97 33 106 170Z" fill="#202e28"/><path d="M224 172v-52a76 76 0 0 1 152 0v52Z" fill="#627264"/><path d="M245 172v-43a55 55 0 0 1 110 0v43Z" fill="#101919"/><path d="M226 122q72-36 148 0l-10 13-15-8-11 12-13-8-12 11-13-11-12 11-12-11-12 10-13-9-13 8Z" fill="#899788"/>
      <path d="M0 250 142 171l104 8 54 20 56-20 105-8 139 79Z" fill="#4e5241"/><path d="m217 250 56-62h54l56 62Z" fill="#806b50"/><path d="M21 217q77-19 143 0l-22 17H35m400-18q77-19 142 0l-14 18H454" fill="#af5328"/><path d="M111 179l9-20 8 20Zm359 0 9-20 8 20Z" fill="#e29c53"/><circle cx="120" cy="170" r="31" fill={`url(#glow-${scene})`}/><circle cx="479" cy="170" r="31" fill={`url(#glow-${scene})`}/>
    </>}
    {scene==='chamber'&&<>
      <path d="M0 0h600v50l-35 15-32-21-35 21-32-20-40 21-30-23-38 20-29-26-38 27-35-23-39 25-31-21-35 21-32-20-42 17Z" fill="#454d3e"/><path d="M0 62 72 43l50 62-12 145H0m600-190-73-17-48 61 12 146h109" fill="#384338"/><ellipse cx="300" cy="229" rx="250" ry="69" fill="#655748"/>
      <path d="M94 225q38-37 78 0m251 0q38-37 78 0" fill="#b08b44"/><path d="M105 218h50m-40-6h35m278 6h53m-42-6h30" stroke="#dfb758" strokeWidth="4"/>
      <path d="M165 166 104 102l76 17 68 23m188 24 59-64-77 17-66 23" fill="#4b3537" stroke="#2e4034" strokeWidth="7"/><ellipse cx="300" cy="170" rx="96" ry="46" fill="#354c3e"/><path d="M249 166q-14-48 18-71l34-13 33 13q32 23 18 71Z" fill="#3c5342"/><path d="M260 107 238 65l30 23m71 19 23-42-30 23" fill="#c1b697" stroke="#536351" strokeWidth="5"/><path d="M260 134q40-25 80 0v29q-40 15-80 0Z" fill="#50644e"/><path d="m274 132 16 4m20 0 16-4" stroke="#f0ad54" strokeWidth="5" strokeLinecap="round"/><path d="M272 160h56l-8 13h-40Z" fill="#25372e"/><path d="M245 201q55 24 110 0" fill="none" stroke="#879178" strokeWidth="8"/>
    </>}
    {scene==='corridor'&&<>
      <path d="M0 0h600v250H0Z" fill="#111019"/><path d="M0 0 205 62v126L0 250Zm600 0-205 62v126l205 62Z" fill="#3b3942"/><path d="M205 62 300 92v96l-95 30Zm190 0-95 30v96l95 30Z" fill="#28272f"/>
      <path d="M300 92v96m-95-126v126m190-126v126M0 0l205 62m395-62-205 62M0 250l205-62m395 62-205-62" fill="none" stroke="#6a6574" strokeWidth="5"/>
      <path d="M0 62q95 22 205 42m390-42q-95 22-205 42M0 188q95-22 205-42m390 42q-95-22-205-42" fill="none" stroke="#8b849a" strokeWidth="4" opacity=".65"/>
      <path d="M118 0h14v250h-14m336-250h14v250h-14" fill="#4b4853"/><circle cx="125" cy="112" r="13" fill="#d5965f"/><circle cx="475" cy="112" r="13" fill="#d5965f"/>
      <path d="M276 123q24-18 48 0v72q-24 14-48 0Z" fill="#0a0910"/><path d="M282 118q18-24 36 0l-7-5-11 5-11-5Z" fill="#171320"/><path d="m290 145 8 3m12 0 8-3" stroke="#a9d8ff" strokeWidth="4" strokeLinecap="round"/>
      <path d="M236 196h128l-20 54H256Z" fill="#9ad9ff" opacity=".22"/><path d="M255 250 271 196h58l16 54Z" fill="#101725"/>
    </>}
    {scene==='guardian'&&<>
      <path d="M0 0 185 45v115L0 250Zm600 0-185 45v115l185 90Z" fill="#3a3740"/>
      <path d="M185 45q115-42 230 0v115H185Z" fill="#4e4b4e"/>
      <path d="M0 250 185 158h230l185 92Z" fill="#595550"/>
      <path d="M90 0q42 75 95 45m325-45q-42 75-95 45M185 45q115-40 230 0" fill="none" stroke="#827d78" strokeWidth="7"/>
      <path d="M250 158v-64q50-44 100 0v64Z" fill="#26242a" stroke="#827d78" strokeWidth="6"/>
      <path d="m300 72 16 24-16 24-16-24Z" fill="#9e879e"/><path d="M300 79v34m-11-17h22" stroke="#d5c0eb" strokeWidth="3"/>
      <circle cx="118" cy="112" r="28" fill={`url(#glow-${scene})`}/><circle cx="482" cy="112" r="28" fill={`url(#glow-${scene})`}/>
      <path d="m118 101-6 12h12Zm364 0-6 12h12Z" fill="#eca25b"/>
      <path d="M160 236 218 168h164l58 68Z" fill="#36333b" stroke="#827d78" strokeWidth="4"/>
      <path d="M236 168h32l-8 22h-30Zm64 0h32l8 22h-30Zm-76 22h34l-10 24h-36Zm76 0h36l12 24h-38Zm-92 24h40l-12 22h-44Zm88 0h44l16 22h-46Z" fill="#9e978e"/>
      <path d="M234 214v-30l12-10-6-10h20l-6 10 12 10v30Z" fill="#cbc3b8" stroke="#4e4b4e" strokeWidth="2.5"/>
      <path d="M340 198v-28l11-11 10 7-4 10 8 22Z" fill="#25232b" stroke="#8b7aa8" strokeWidth="2.5"/>
      <path d="M294 234v-28l6-12 6 12v28Z" fill="#2c2934" stroke="#8b7aa8" strokeWidth="2"/>
    </>}
  </svg>;
}
