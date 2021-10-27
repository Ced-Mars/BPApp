import React, { useEffect, useState } from "react";
import { makeStyles } from '@mui/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {Box, Paper, Step, Stepper, StepButton, Typography, Button, StepLabel, StepContent, List, ListItem, ListItemText, Card, CircularProgress, IconButton } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import NotesIcon from '@mui/icons-material/Notes';
import "./Display.css";
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://127.0.0.1:4001";
const socket = socketIOClient(ENDPOINT);


const theme = createTheme();


const useStyles = makeStyles((theme) => ({
  root: {
    flex:1,
    width: "100%",
    display: "flex",
    flexDirection: "column",

  },
  stepper:{
    flex: "1 0 auto"
  },
  content:{
    flex: "1 0 auto",
    display:"flex",
    alignItems:"stretch",
    height:"0px",
    overflowY: "hidden",
    overflowY:"scroll"
  },
  footer:{
    display:"flex",
    flexDirection:"column",
    alignContent:"stretch",
    marginBottom:"10px",
    flex: "0 0 auto"
  },
  footerData:{
    flex:1,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
  },
  footerButtons:{
    flex:1,
    display:"flex",
    justifyContent:"space-evenly",
  },
  list:{
    flex:1,
    display:"flex",
    flexDirection:"column",
    overflow:"hidden",
    margin:"5px",
    padding:"5px"
  },
  card:{
    display:"flex",
    flexDirection:"column",
    flex:3,
    justifyContent:"center",
    alignItems:"center",
    margin:"5px",
    padding:"5px"
  },
  actions:{
    flex:1,
    margin:"10px"
  },
  rails:{
    margin:"10px"
  },
  completed: {
    display: "inline-block"
  },
  instructions: {
    flex:1,
    textAlign:"center"
  },
  stepIcon:{
    color:"red",
  }
}), {index:1});

function decodeData(data, index){
  var table = [];
  if(typeof data == "object"){
    Object.values(data).forEach(val => {
      if (typeof val == "object"){
        const key = Object.keys(val);
        table = [...table, key[0]];
        index--;
        if (index > 0){
            table.push.apply(table, decodeData(val[key[0]]["children"], index)); 
        }
      }else{
        table = [...table, val];
      }
    })
  }
  return table;
};

function decodeRail(data, index, rail){
  var table = [];
  if(typeof data == "object"){
    Object.values(data).forEach(val => {
      if (typeof val == "object"){
        const key = Object.keys(val);
        index--;
        if (index > 0){
          if(key[0]==rail){
            table.push.apply(table, decodeData(val[key[0]]["children"], index));
          }else{
            table.push.apply(table, decodeRail(val[key[0]]["children"], index, rail)); 
          }
            
        }
      }
    })
  }
  return table;
};

function getSteps(props) {
  var table = ["Début"];
  Object.keys(props).map((value, index) => {
    table = [...table, index+1];
  })
  table = [...table, "Fin"];
  return table;
}

function getStepContent(props, array, step) {
  switch (step) {
    case 0:
      return `Début de la procédure`;
    default:
      return `Step ${step}`;
    case (array.length-1):{
      return "Fin de la procédure";
    }
      
  }
}

function getRails(props, array, step){
  switch (step) {
    case 0:
      return [`Début de la procédure`];
    default: {
      return decodeData(props["root"]["children"], 2);
    } 
    case (array.length-1):{
      return ["Fin de la procédure"];
    }
  }
}

function getActions(props, activeRail){
  if(activeRail == "go home movement"){
    return [];
  }
  return decodeRail(props["root"]["children"], 5, activeRail);
}


//Fonctionnement avec socket
export default function Display() {
  const [response, setResponse] = useState([]);
  const [action, setAction] = useState("");
  
  useEffect(() => {
    socket.on("FromBPAll", (a) => {
      setResponse(a);
    });
    socket.on("FromBPAdv", (a) => {
      setAction(a);
    });
    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
  }, [socket]);

  
  if (response && response.length!==0 && response!== "Attente de la Recette") {
    return <RenderSequence props={response} action={action} />;
  }
  return <RenderText props={response} />;
  
}


function RenderText({ props }) {
  const divStyle = {
    color: "blue",
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

function RenderSequence({ props, action }) {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState(new Set());
  const [steps, setSteps] = React.useState(getSteps(props));

  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return completed.size;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const handleNext = () => {
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? // It's the last step, but not all steps have been completed
          // find the first step that has been completed
          steps.findIndex((step, i) => !completed.has(i))
        : activeStep + 1;

    setActiveStep(newActiveStep);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleStep = step => () => {
    setActiveStep(step);
    if(showCard == true){
      setShowCard(false);
      setActiveRail("");
    }
  };

  const handleComplete = () => {
    const newCompleted = new Set(completed);
    newCompleted.add(activeStep);
    setCompleted(newCompleted);

    /**
     * Sigh... it would be much nicer to replace the following if conditional with
     * `if (!this.allStepsComplete())` however state is not set when we do this,
     * thus we have to resort to not being very DRY.
     */
    if (completed.size !== totalSteps()) {
      handleNext();
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted(new Set());
  };

  function isStepComplete(step) {
    return completed.has(step);
  }

  //Rails + Card
  const [activeRail, setActiveRail] = React.useState("");
  const [completedRail, setCompletedRail] = React.useState(new Set());
  const [showCard, setShowCard] = React.useState(false);

  function onClickCard(key){
    if(getActions(props, key).length != 0){
      console.log("getactions", getActions(props, key));
      if(showCard == false){
        setActiveRail(activeRail => key);
        setShowCard(true);
      }else{
        if(activeRail == key){
          setShowCard(false);
          setActiveRail(activeRail => "");
        }else{
          setActiveRail(activeRail => key);
        }
        
      }
    }else{
      if(showCard == true){
        setShowCard(false);
        setActiveRail(activeRail => "");
      }
    }
    
  }

  const handleCompleteRail = () => {
    const newCompleted = new Set(completedRail);
    newCompleted.add(activeRail);
    setCompletedRail(newCompleted);
  };

  function isRailComplete(rail) {
    return completedRail.has(rail);
  }

  // Actions
  const [activeAction, setActiveAction] = React.useState("");
  const [completedAction, setCompletedAction] = React.useState(new Set());

  const handleCompleteAction = () => {
    const newCompleted = new Set(completedAction);
    newCompleted.add(activeAction);
    setCompletedAction(newCompleted);
  };

  function isActionComplete(action) {
    return completedAction.has(action);
  };

  useEffect(() => {
    //Si rail
    if(getRails(props, steps, 1).includes(action)){
      setActiveRail(activeRail => action);
      setActiveAction(activeAction => action);
      console.log("action ", action);
      if(!isRailComplete(action)){
        handleCompleteRail();
      }
      console.log("rail set ",completedRail);
    }
    //Ou action
    if(getActions(props, activeRail).includes(action)){
      setActiveAction(activeAction => action);
      if(!isActionComplete(action)){
        handleCompleteAction();
      }
      console.log("action set ",completedAction);
    }
  }, [action, activeAction]);

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root}>
        <Stepper alternativeLabel nonLinear activeStep={activeStep}>
          {steps.map((label, index) => {
            const stepProps = {};
            const buttonProps = {};
            return (
              <Step key={label} {...stepProps} completed={isStepComplete(index)}>
                <StepButton
                  focusRipple={true}
                  onClick={handleStep(index)}
                  {...buttonProps}
                >
                  <StepLabel
                    StepIconProps={{
                      classes: { root: classes.stepIcon }
                    }}
                  >
                    {label}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
        
        <div className={classes.content}>
          <List className={classes.list}>
            {getRails(props, steps, activeStep).map((value, i, arr) => {
              return(
                  <ListItem button key={value} className={classes.rails} style={isRailComplete(value) ? {flex:1, backgroundColor:"lightgreen"} : {flex:1}} onClick={() => onClickCard(value)} 
                  secondaryAction={getActions(props, value).length != 0 ? !showCard ? <IconButton edge="end" aria-label="see more">
                      <NotesIcon />
                    </IconButton> : null
                     : null
                  }> 
                    <ListItemText primary={value} >
                    </ListItemText>
                  </ListItem>
              );
            })}
          </List>
          { showCard ? 
            <Card className={classes.card}>
              {getActions(props, activeRail).map((value, i, arr) => {
                return(
                  <ListItem key={value} className={classes.actions} style={{flex:1}} 
                  secondaryAction={isActionComplete(value) ? 
                    <IconButton edge="end" aria-label="validated">
                      <CheckIcon />
                    </IconButton> : null
                  }>
                    <ListItemText primary={value}>
                    </ListItemText>
                  </ListItem>
                );
              })}
            </Card> : null 
          }
          
        </div>

        <div className={classes.footer}>
          {allStepsCompleted() ? (
            <div className={classes.footerData}>
              <Typography className={classes.instructions}>
                All steps completed - you&apos;re finished
              </Typography>
              <Button onClick={handleReset}>Reset</Button>
            </div>
          ) : (
            <div className={classes.footerData}>
              <Typography className={classes.instructions}>
                {getStepContent(props, steps, activeStep)}
              </Typography>
              <div className={classes.footerButtons}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  className={classes.button}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  className={classes.button}
                >
                  Next
                </Button>

                {activeStep !== steps.length &&
                  (completed.has(activeStep) ? (
                    <Typography variant="caption" className={classes.completed}>
                      Step {activeStep + 1} already completed
                    </Typography>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleComplete}
                    >
                      {completedSteps() === totalSteps() - 1
                        ? "Finish"
                        : "Complete Step"}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
    
  );
}


