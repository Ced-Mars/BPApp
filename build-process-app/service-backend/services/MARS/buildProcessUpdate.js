//Changing the received action to success in the build process by matching ids -- helps keeping an updated ressource
//Also changing the sequence ROBOT to success if the last action in Stepstages(ROBOT) is a success
//Changing the USER sequence to success if received action match
function checkAction(array, action, socket, percentage, addToDB){
  const TAG = "FUNCTION checkAction: ";
  for (const [i, value] of Object.entries(array)) { //loop through the array of objects and get key - value pair
    if(value.status != "SUCCESS"){
      for (const [j, value1] of Object.entries(value.stepStages)) { // Loop through an array of arrays
        if(Array.isArray(value1)){
          for (const [k, value2] of Object.entries(value1)) {  //loop through an array of objects and get key1 - value pair
            if(action.uid == value2.uid){
              if(value.stepStages.indexOf(value1) == (value.stepStages.length - 1)){
                value.status = "SUCCESS";
              }
              percentage+=(1/value.total);
              addToDB(percentage, "MARS", "process", {target: "MARS_1"}, { $set: { percentage: percentage }}, {upsert: true});
              socket.emit("Percentage", percentage);
              return value1.status = "SUCCESS";
            }
          }
        }else{
          if(action.uid == value1.uid){
            if(value.stepStages.indexOf(value1) == (value.stepStages.length - 1)){
              value.status = "SUCCESS";
              addToDB(array, "MARS", "buildprocess", {processus_target: "MARS_1"}, { $set: { data: array }}, {upsert: true});
              addToDB(percentage, "MARS", "process", {target: "MARS_1"}, { $set: { percentage: 0 }}, {upsert: true});
              return value1.status = "SUCCESS";
            }else{
              percentage+=(1/value.total);
              addToDB(percentage, "MARS", "process", {target: "MARS_1"}, { $set: { percentage: percentage }}, {upsert: true});
              socket.emit("Percentage", percentage);
              return value1.status = "SUCCESS";
            }
          }
        }
      }
    }
  }
}
  
  
function changingUserObjects(message, callback){
  let TAG = "Function changingUserObjects : ";
  var newUserArray = [];
  //modifying the build process to match the data we need on the client side - User objects only
  message.map((value, i, arr) => {
    if(value.stepStages.length > 1){
      if(value.target == "USER"){
        value["stepStages"].map((v) => {
          newUserArray.push({
            "stepStages":[v],
            "target":"USER"
          });
        });
        newUserArray.map((v1, j) => {
          if(j == 0){
            message.splice(i, 1, v1);
          }else{
            message.splice(i+1, 0, v1);
          }
        });
        newUserArray.length = 0;
      }
    }else{
      console.log(TAG + "stepStages array of length 0 or 1");
    }
  });
  console.log(TAG + "Build Process with User ", message);

  return callback(message);
}
  
  
//Assembling all actions of drilling/fastening into a new array
//This programm moves all actions between APPROACH and CLEARANCE into a new array
function changingStepStages(message){
  var newStepStages = [];
  var stages = [];
  //modifying the build process to match the data we need on the client side - Stepstages arrays only
  message.map((value, i, arr) => {
    value.status="WAITING";
    value.total=value.stepStages.length;
    value.duration = 3*value.total;
    value["stepStages"].map((v) => {
      v.status="WAITING";
      if(v.type == "MOVE.STATION.WORK" || v.type == "MOVE.ARM.APPROACH" || v.type == "MOVE.ARM.WORK" || v.type == "WORK.DRILL" || v.type == "WORK.FASTEN"){
        stages.push(v);
      }else{
        stages.push(v);
        if(stages.length == 1){
          newStepStages.push(...stages);
        }else{
          newStepStages[newStepStages.push([]) - 1].push(...stages);
        }
        stages.length = 0;
      }
    });
    value.stepStages.length = 0;
    value.stepStages.push(...newStepStages);
    newStepStages.length = 0;
  });
  return message;
}

function UpdateArrayUserElementsV2(message, callback){
  var tempArray = [];
  var newArray = [];
  message.map((value, i, arr) => {
    if(value.assets.some(e => e.uid === "human")){    
      if(tempArray.length > 0){
        newArray.push(
          {
            "stepStages": [...tempArray],
            "target": "ROBOT"
          }
        );
        tempArray.length = 0;
      }
      newArray.push(
        {
          "stepStages": [value],
          "target": "USER"
        }
      );
    }else if(value.assets.some(e => e.uid === "mars")){
      tempArray.push(value);
    }else{
      console.error("One action has unknown asset(s)");
    }
  });
  console.log("Array User and Sequence separated", newArray);
  return callback(newArray);
}

function updateArraySequenceElementsV2(message){
  var newStepStages = [];
  var stages = [];
  //modifying the build process to match the data we need on the client side - Stepstages arrays only
  message.map((value, i, arr) => {
    value.status="WAITING";
    value.total=value.stepStages.length;
    value.duration = value.total*3;
    value["stepStages"].map((v) => {
      v.status="WAITING";
      if(v.type == "MOVE.STATION.WORK" || v.type == "MOVE.ARM.APPROACH" || v.type == "MOVE.ARM.WORK" || v.type == "WORK.DRILL" || v.type == "WORK.FASTEN"){
        stages.push(v);
      }else{
        stages.push(v);
        if(stages.length == 1)
          newStepStages.push(...stages);
        else
          newStepStages[newStepStages.push([]) - 1].push(...stages);
        stages.length = 0;
      }
    });
    value.stepStages.length = 0;
    value.stepStages.push(...newStepStages);
    newStepStages.length = 0;
  });
  return message;
}



  module.exports = {checkAction, changingUserObjects, changingStepStages, UpdateArrayUserElementsV2, updateArraySequenceElementsV2}