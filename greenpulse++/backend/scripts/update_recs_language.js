const env = require('../src/config/env');
const mongoose = require('mongoose');

const transformations = [
  { match: /execute.*500kw.*solar.*ppa.*agreement/i, replacement: 'Arrange a rooftop solar agreement for the factory to use more clean electricity.' },
  { match: /reschedule.*paint.*shop.*curing.*oven/i, replacement: 'Schedule Paint Shop curing ovens during lower electricity rate hours.' },
  { match: /install.*variable frequency drives.*vfd.*press.*shop/i, replacement: 'Install speed controls on Press Shop cooling pumps to reduce power use.' },
  { match: /implement.*closed-loop.*solvent.*recovery/i, replacement: 'Reuse cleaning solvent in the paint line to reduce chemical purchases and waste.' },
  { match: /shift.*paint.*shop.*drying.*ovens/i, replacement: 'Schedule Paint Shop drying ovens during lower electricity rate night hours.' },
  { match: /upgrade.*hydraulic.*pump.*motors.*stamping.*line.*2/i, replacement: 'Replace Stamping Line 2 hydraulic pump motors with energy-saving models.' },
  { match: /install.*250kw.*rooftop.*solar/i, replacement: 'Install a 250kW rooftop solar system on the main warehouse roof for clean electricity.' },
  { match: /install.*sub-metering.*machining.*line.*4/i, replacement: 'Install an electricity meter on Machining Line 4 to find extra power use.' },
  { match: /re-align.*motor.*drive.*belts/i, replacement: 'Check and adjust motor drive belts to stop slipping and power loss.' }
];

async function updateDb() {
  await mongoose.connect(env.MONGO_URI);
  const col = mongoose.connection.collection('recommendations');
  const recs = await col.find({}).toArray();
  let updatedCount = 0;

  for (const r of recs) {
    let newAction = r.action;
    for (const t of transformations) {
      if (t.match.test(r.action)) {
        newAction = t.replacement;
        break;
      }
    }
    if (newAction !== r.action) {
      await col.updateOne({ _id: r._id }, { $set: { action: newAction } });
      console.log('Updated:', r.action, '->', newAction);
      updatedCount++;
    }
  }

  console.log('Total updated in DB:', updatedCount);
  await mongoose.disconnect();
}

updateDb().catch(err => {
  console.error(err);
  process.exit(1);
});
