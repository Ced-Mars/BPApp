import React from "react";
import {List, ListItem, ListItemText, Button, Typography, Card } from "@mui/material";
import "./Display.css";

export default function RenderSequence({ 
    props,
    setProps,
    action,
    setAction,
    statut,
    setStatut,
    activeStep,
    setActiveStep,
    end,
    setEnd,
    socket,
    percentage
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
      padding:"5px",
    };
    const cardlistitems = {
      flex:1,
      marginTop:"3px",
    };
    const listitems = {
      flex:1,
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
  
    //Reset everything
    const handleReset = () => {
      setActiveStep(0);
      setProps([]);
      setAction("");
      setStatut("");
      setEnd(false);
      socket.emit("ResetFromClient", "reset");
    };
  
    return (
      <div style={root}>
        <div style={content}>
          <List style={list}>
            {props.map((value, i, arr) => {
              return(
                <Card style={{flex:1, marginTop:"3px", backgroundColor: i == activeStep ? 'lightblue' : value.status == "SUCCESS" ? 'lightgreen' : 'lightgrey'}}>
                  <ListItem key={i} style={listitems}> 
                    <ListItemText primary={`${value["target"]} Action`} style={listitems}>
                    </ListItemText>
                      {value.target == "USER" ? i == activeStep ? <div style={listitems}><Button>Valider</Button> </div> : <div style={listitems}></div> : i == activeStep ? <div style={listitems}>{percentage} %</div> : <div style={listitems}></div> }
                      <div style={listitems}>{value["status"]}</div>
                  </ListItem>
                </Card>
              );
            })}
          </List>
        </div>
          {end ? (
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
            </div>
          }
      </div>
    );
}