const mongoose = require('mongoose');
(async()=>{
  try{
    const uri = process.env.MONGO_URI;
    console.log('Connecting to:', uri ? uri.slice(0,60) + '...' : '(no uri)');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const schema = new mongoose.Schema({}, { strict:false, collection:'nutritionprofiles' });
    const Nutrition = mongoose.model('NutritionProfile', schema);
    const res = await Nutrition.deleteMany({ ownerId: null });
    console.log('DELETE_RESULT', JSON.stringify(res));
    await mongoose.disconnect();
    process.exit(0);
  }catch(e){
    console.error('ERR', e);
    process.exit(2);
  }
})();
