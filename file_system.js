console.log('Starting app...');

const fs = require('fs');

// --- Async method -----

fs.appendFile('test.txt',"Hello Node.. \n", function(err){
	if(err){
			console.log("Error in file write" + err);
	}else{
		console.log("Written successfully");
	}

})

// --- Sync method

fs.appendFileSync('test.txt',"Hello Node Sync.. \n");
