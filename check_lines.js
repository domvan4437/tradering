const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')
let lines = s.split('\n')

// Check what's in each section
console.log('L290-295:', lines.slice(289,295).map((l,i)=>(290+i)+': '+l.trim().slice(0,60)))
console.log('L297-302:', lines.slice(296,302).map((l,i)=>(297+i)+': '+l.trim().slice(0,60)))
console.log('L358-365:', lines.slice(357,365).map((l,i)=>(358+i)+': '+l.trim().slice(0,60)))
console.log('L445-455:', lines.slice(444,455).map((l,i)=>(445+i)+': '+l.trim().slice(0,60)))
console.log('L650-660:', lines.slice(649,660).map((l,i)=>(650+i)+': '+l.trim().slice(0,60)))
