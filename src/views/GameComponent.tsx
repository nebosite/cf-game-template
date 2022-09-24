// App Navigation handled here
import {  getTemplatoPresenterTypeHelper } from "../models/PresenterModel";
import {  getTemplatoClientTypeHelper } from "../models/ClientModel";
import { ClusterFunGameProps } from "clusterfun-client";
import React from "react";
import { ClusterfunGameComponent } from "clusterfun-client";

const lazyPresenter = React.lazy(() => import(`./Presenter`));
const lazyClient = React.lazy(() => import(`./Client`));

// -------------------------------------------------------------------
// Main Game Page
// -------------------------------------------------------------------
export default class TemplatoGameComponent extends ClusterfunGameComponent {
    // -------------------------------------------------------------------
    // ctor
    // -------------------------------------------------------------------
    constructor(props: ClusterFunGameProps) {
        super(props);

        this.init(
            lazyPresenter, 
            lazyClient, 
            getTemplatoPresenterTypeHelper, 
            getTemplatoClientTypeHelper)
    }
}

