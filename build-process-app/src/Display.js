import React, { useEffect, useState } from "react";
import {List, ListItemText, Stepper, Step, StepButton, Button, Typography, CircularProgress, StepLabel, ListItemButton } from "@mui/material";
import "./Display.css";
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://127.0.0.1:4001";
const socket = socketIOClient(ENDPOINT);



//Fonctionnement avec socket
export default function Display() {
  const [response, setResponse] = useState([]);
  const [action, setAction] = useState("");
  const [statut, setStatut] = useState("");
  const [dansSeq, setDansSeq]= useState(true);
  const [completedAction, setCompletedAction] = React.useState([]);
  const [activeStep, setActiveStep] = React.useState(0);
  const [visibleStep, setVisibleStep] = React.useState(0);
  const [completedStep, setCompletedStep] = React.useState({});
  
  useEffect(() => {
    socket.on("FromBPAll", (a) => {
      setResponse(a);
    });
    socket.on("FromBPAdv", (a) => {
      setAction(a["id"]);
      setStatut(a["status"]);
    });
    socket.on("GetAction", (a) => {
      setCompletedAction(a);
    });
    socket.on("CompletedStep", (a) => {
      setCompletedStep(a);
    });
    socket.on("ActiveStep", (a) => {
      setActiveStep(a);
    });
    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
  }, [socket]);


  
  if (response && response.length!==0 && response!== "Attente de la Recette") {
    return <RenderSequence 
    props={response} 
    setProps={setResponse}
    action={action} 
    setAction={setAction}
    statut={statut} 
    setStatut={setStatut}
    dansSeq={dansSeq}
    setDansSeq={setDansSeq}
    completedAction={completedAction} 
    setCompletedAction={setCompletedAction}
    activeStep={activeStep}
    setActiveStep={setActiveStep}
    visibleStep={visibleStep}
    setVisibleStep={setVisibleStep}
    completedStep={completedStep}
    setCompletedStep={setCompletedStep}
    />
  }
  return <RenderText props={response} />;
  
}


function RenderText({ props }) {
  const divStyle = {
    color: "blue",
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  return (
    <div style={divStyle}>
      <CircularProgress />
      <p>{props}</p>
    </div>
    
  );
}





function RenderSequence({ 
  props,
  setProps,
  action,
  setAction,
  statut,
  setStatut,
  dansSeq,
  setDansSeq,
  completedAction, 
  setCompletedAction,
  activeStep,
  setActiveStep,
  visibleStep,
  setVisibleStep,
  completedStep,
  setCompletedStep,
}) {
  const root = {
    flex:1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  };
  const footer = {
    display:"flex",
    marginBottom:"10px",
    flex: "0 0 auto"
  };
  const content = {
    flex: "1 0 auto",
    display:"flex",
    alignItems:"stretch",
    height:"0px"
  };
  const list = {
    flex:1,
    display:"flex",
    flexDirection:"column",
    overflow:"auto",
    margin:"5px",
    padding:"5px"
  };
  const stepper = {
    flex: "1 0 auto"
  };
  const instructions = {
    flex: 1
  };
  const footerReset = {
    flex: 1
  };

  function isActionComplete(action) {
    return completedAction.includes(action);
  };

  //Gestion Steps
  const totalSteps = () => {
    return props.length;
  };

  //return an array of string representing each step id and "End" string
  function getSteps(props) {
    var array = [];
    props.map((value, index) => {
      array = [...array, index+1];
    })

    return array;
  }

  const completedSteps = () => {
    return Object.keys(completedStep).length;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const handleStep = (step) => () => {
    if(dansSeq == true){
      setDansSeq(false);
    }
    setVisibleStep(step);
  };

  //Reset everything
  const handleReset = () => {
    setActiveStep(0);
    setVisibleStep(0);
    setCompletedStep({});
    setProps([]);
    setCompletedAction([]);
    setAction("");
    setStatut("");
    setDansSeq(true);
    socket.emit("Reset", "reset");
  };

  //Get back to the active (working) step
  const handleFollow = () => {
    setVisibleStep(activeStep);
    if(dansSeq == false){
      setDansSeq(true);
    }
  }

  useEffect(() => {
    if(dansSeq == true){
      setVisibleStep(activeStep);
    }

  }, [activeStep]);



  return (
      <div style={root}>
        <Stepper alternativeLabel nonLinear activeStep={visibleStep}>
          {getSteps(props).map((label, index) => {
            return (
              <Step key={index} completed={completedStep[index]}>
                <StepButton
                  focusRipple={true}
                  onClick={handleStep(index)}
                >
                  <StepLabel>
                    {label}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
        
        <div style={content}>
          <List style={list}>
            {props[visibleStep].map((value, i, arr) => {
              return(
                  <ListItemButton key={value["id"]} style={isActionComplete(value["id"]) ? {flex:1, backgroundColor:"lightgreen"} : {flex:1}} autoFocus={dansSeq ? value["id"]==action ? true : false : false}> 
                    <ListItemText primary={value["description"]}>
                    </ListItemText>
                  </ListItemButton>
              );
            })}
          </List>
          
        </div>

          {allStepsCompleted() ? (
            <div style={footer}>
              <Typography style={instructions}>
                Process has ended, you can reset it or launch a new process.
              </Typography>
              <Button onClick={handleReset} style={footerReset}>Reset</Button>
            </div>
            ) : 
            <div style={footer}>
              <Typography style={instructions}>
                Action en cours : {action} - Statut : {statut}
              </Typography>
              {dansSeq ? null : <Button onClick={handleFollow} style={footerReset}>Reprendre la séquence en cours</Button>}
              
            </div>
          }
        </div>
  );
}


