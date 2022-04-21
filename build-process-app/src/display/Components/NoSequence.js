import React from "react";
import { CircularProgress } from "@mui/material";
import "./Display.css";


export default function RenderText() {
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
        <p>En attente de la recette</p>
      </div>
      
    );
}