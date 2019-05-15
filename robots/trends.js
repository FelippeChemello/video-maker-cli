const googleTrends = require('google-trends-api');

async function robot() {
    let resultado = "INICIO";

    await googleTrends.dailyTrends({
       geo: 'BR'
    }, function (err, results) {
        if(err){
            console.log(err);
        }else{
            resultado = results;
        }
    });

    console.log(resultado);

}

module.exports = robot;