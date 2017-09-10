import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { RepoName } from './pipes/repo-name.pipe'

import { AppComponent } from './app.component';

// Imports for loading & configuring the in-memory web api

@NgModule({
  declarations: [
    AppComponent, 
    RepoName
  ],
  imports: [
    BrowserModule,
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
