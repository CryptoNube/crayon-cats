var web3 = new Web3(Web3.givenProvider);


var instance;
var marketplaceInstance;
var user;
var contractAddress = "0xc06B70f655498dB4b59c4515dbE7417A62569E57";

var contractOwner = "0x47b4E7EDC0234C0a41e39ca2afdcA58Dd56DF392";

function start() {


  window.ethereum.enable().then(function(accounts){

     instance = new web3.eth.Contract(abi, contractAddress, {from: accounts[0]});

    //  instance.methods.owner().call().then(test => {
    //   contractOwner = test;
    // });
     user = accounts[0]; 
     



  instance.events.MarketTransaction().on('data', (event) => {
      console.log(event);
  })
  .on('error', console.error);
  });

}

$(document).ready(function(){
    window.ethereum.enable().then(function(accounts){
       instance = new web3.eth.Contract(abi, contractAddress, {from: accounts[0]});

      //  instance.methods.owner().call().then(test => {
      //   contractOwner = test;
      // });
       user = accounts[0]; 


/* 
*   Listen for the `Birth` event, and update the UI
*   This event is generate in the KittyBase contract
*   when the _createKitty internal method is called
*/
instance.events.Birth().on('data', function(event) {
      console.log(event);
      let owner = event.returnValues.owner;
      let kittyId = event.returnValues.kittyId;
      let mumId = event.returnValues.mumId;
      let dadId = event.returnValues.dadId;
      let genes = event.returnValues.genes        
      alert_msg("owner:" + owner
      + " kittyId:" + kittyId
      + " mumId:" + mumId
      + " dadId:" + dadId
      + " genes:" + genes,'success')
}).on('error', console.error);

instance.events.MarketTransaction().on('data', (event) => {
      console.log(event);
      var eventType = event.returnValues["TxType"].toString()
      var tokenId = event.returnValues["tokenId"]
      if (eventType == "Buy") {
        alert_msg('Succesfully Kitty purchase! Now you own this Kitty with TokenId: ' + tokenId, 'success')
      }
      if (eventType == "Create offer") {
        alert_msg('Successfully Offer set for Kitty id: ' + tokenId, 'success')
        $('#cancelBox').removeClass('hidden')
        $('#cancelBtn').attr('onclick', 'deleteOffer(' + tokenId + ')')
        $('#sellBtn').attr('onclick', '')
        $('#sellBtn').addClass('btn-warning')
        $('#sellBtn').html('<b>For sale at:</b>')
        var price = $('#catPrice').val()
        $('#catPrice').val(price)
        $('#catPrice').prop('readonly', true)

    
  }
  if (eventType == "Remove Offer") {
    alert_msg('Successfully Offer remove for Kitty id: ' + tokenId, 'success')
    $('#cancelBox').addClass('hidden')
    $('#cancelBtn').attr('onclick', '')          
    $('#catPrice').val('')
    $('#catPrice').prop('readonly', false)
    $('#sellBtn').removeClass('btn-warning')
    $('#sellBtn').addClass('btn-success')
    $('#sellBtn').html('<b>Sell me</b>')
    $('#sellBtn').attr('onclick', 'sellCat(' + tokenId + ')')          
  }
})
.on('error', console.error);
});

});


async function getInventory(){
  var arrayId = await instance.methods.getAllTokenOnSale().call();
  console.log(arrayId);
  for (i = 0; i < arrayId.length; i++) {
    if(arrayId[i] !=0){ 
      appendKitty(arrayId[i]);
    }
  }
}

//Get kitties for breeding that are not selected
async function breedKitties(gender) {
  var arrayId = await instance.methods.getKittyByOwner(user).call();
  for (i = 0; i < arrayId.length; i++) {
    appendBreed(arrayId[i],gender)
  }
}

//Appending cats to breed selection
async function appendBreed(id,gender) {
  var kitty = await instance.methods.getKitty(id).call()  
  breedAppend(kitty[0], id, kitty['generation'],gender)
}

async function Breed(dadId,mumId) {
    try {
      var newKitty = await instance.methods.breed(dadId,mumId).send()  
      //log(newKitty)
      console.log(newKitty)
      setTimeout(()=>{
        go_to('myCats.html')
      },2000)
    } catch (err){
      //log(err)
      console.log(err)
    } 
    //console.log("hello")
    //return newKitty
}

//append cats for catalog
async function appendKitty(id) {
  var kitty = await instance.methods.getKitty(id).call()
  appendCat(kitty[0], id, kitty['generation'])
}

async function singleKitty() {
  var id = get_variables().catId
  var kitty = await instance.methods.getKitty(id).call()
  singleCat(kitty[0], id, kitty['generation'])
}

// Checks that the user address is same as the cat owner address
//This is use for checking if user can sell this cat
async function catOwnership(id) {

  var address = await instance.methods.ownerOf(id).call()

  if (address.toLowerCase() == user.toLowerCase()) {      
    return true
  }  
  return false

}

async function sellCat(id) {  
  var price = $('#catPrice').val()
  var amount = web3.utils.toWei(price, "ether")
  try {
    await instance.methods.setOffer(amount,id).send();
  } catch (err) {
    console.log(err);
  }
}

async function buyKitten(id, price) {
  var amount = web3.utils.toWei(price, "ether")
  try {
    await instance.methods.buyKitty(id).send({ value: amount });
  } catch (err) {
    console.log(err);
  }

}

async function checkOffer(id) {

  let res;
  try {

    res = await instance.methods.getOffer(id).call();
    var price = res['price'];
    var seller = res['seller'];
    var onsale = false
    //If price more than 0 means that cat is for sale
    if (price > 0) {
      onsale = true
    }
    //Also might check that belong to someone
    price = Web3.utils.fromWei(price, 'ether');
    var offer = { seller: seller, price: price, onsale: onsale }
    log(offer)
    return offer

  } catch (err) {
    console.log(err);
    return
  }
}

function createKitty() {
  var dnaStr = getDna();
  let res;
  try {
    res = instance.methods.createKittyGen0(dnaStr).send();
  } catch (err) {
    console.log(err);
  }
}

// Get all the kitties from address
async function kittyByOwner(address) {

  let res;
  try {
    res = await instance.methods.getKittyByOwner(address).call();
  } catch (err) {
    console.log(err);
  }
}

//Gen 0 cats for sale
async function contractCatalog() {
  var arrayId = await instance.methods.getKittyByOwner(contractOwner).call();
  log(arrayId)
  for (i = 0; i < arrayId.length; i++) {
    appendKitty(arrayId[i])
  }
}

//Get kitties of a current address
async function myKitties() {
  var arrayId = await instance.methods.getKittyByOwner(user).call();
  for (i = 0; i < arrayId.length; i++) {
    appendKitty(arrayId[i])
  }
}

async function deleteOffer(id) {
  try {
    await instance.methods.removeOffer(id).send();    
  } catch (err) {
    console.log(err);
  }

}

async function totalCats() {
  var cats = await instance.methods.totalSupply().call();
  log(cats)
}

function displayKittyInfo(owner, kittyId, mumId, dadId, genes) {
    $("kittytable").removeClass('hidden')
    $("#kittyOnwer").text(owner);
    $("#kittyId").text(kittyId);
    $("#kittyMum").text(mumId);
    $("#kittyDad").text(dadId);
    $("#kittyGenes").text(genes);
}    