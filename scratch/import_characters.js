const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'horror-of-oz-805'
  });
}

const db = admin.firestore();

const characters = [
  {
    id: 'dorothy-dot-gale',
    name: 'Dorothy “Dot” Gale',
    role: 'The Lost Protagonist',
    faction: 'The Seekers',
    image: '/character-references/Dorothy “Dot” Gale.jpg'
  },
  {
    id: 'dribble-gearling',
    name: 'Dribble Gearling',
    role: 'The Tinkerer Twin',
    faction: 'The Gearmen',
    image: '/character-references/Dribble Gearling.jpg'
  },
  {
    id: 'crate-gearling',
    name: 'Crate Gearling',
    role: 'The Heavy Twin',
    faction: 'The Gearmen',
    image: '/character-references/Crate Gearling.jpg'
  },
  {
    id: 'ezra-morrow',
    name: 'Ezra Morrow',
    role: 'The Shadow Weaver',
    faction: 'Nightmare Court',
    image: '/character-references/Ezra Morrow.jpg'
  },
  {
    id: 'lord-llew-barron',
    name: 'Lord Llew Barron',
    role: 'The Corrupted Aristocrat',
    faction: 'Emerald Elite',
    image: '/character-references/Lord Llew Barron.jpg'
  },
  {
    id: 'mick',
    name: 'Mick',
    role: 'The Silent Enforcer',
    faction: 'The Unbound',
    image: '/character-references/Mick.jpg'
  },
  {
    id: 'mira-voss',
    name: 'Mira Voss',
    role: 'The Alchemist',
    faction: 'The Seekers',
    image: '/character-references/Mira Voss.jpg'
  },
  {
    id: 'sir-hollin-thatch',
    name: 'Sir Hollin Thatch',
    role: 'The Hollow Knight',
    faction: 'Emerald Elite',
    image: '/character-references/Sir Hollin Thatch.jpg'
  },
  {
    id: 'the-yellow-whisperer',
    name: 'The Yellow Whisperer',
    role: 'The Harbinger',
    faction: 'Nightmare Court',
    image: '/character-references/The Yellow Whisperer.jpg'
  }
];

async function importCharacters() {
  for (const char of characters) {
    const docRef = db.collection('characters').doc(char.id);
    const data = {
      characterId: char.id,
      displayName: char.name,
      slug: char.id,
      primaryReferenceImageUrl: char.image,
      referenceOnly: true,
      approvedForPublicUse: false,
      approvalStatus: 'reference_only',
      role: char.role,
      faction: char.faction,
      visualNotes: 'Official turnaround reference for character consistency. Maintain gothic, desaturated aesthetic.',
      consistencyPrompt: `${char.name}, a ${char.role} from ${char.faction}. Cinematic lighting, gothic atmosphere, hyper-detailed.`,
      cardArtPrompt: `Full-body cinematic character art of ${char.name}, gothic oz style, hyper-detailed, dramatic shadows.`,
      scenePrompt: `${char.name} in a dark, atmospheric Oz environment.`,
      negativePrompt: 'bright colors, cheerful, cartoon, low resolution, blurry, distorted, missing limbs.',
      publicCardArtUrl: '',
      publicSceneArtUrl: '',
      publicPortraitUrl: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.set(data);
    console.log(`Imported: ${char.name}`);
  }
}

importCharacters().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
