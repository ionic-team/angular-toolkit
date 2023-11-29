import { Component, OnInit } from '@angular/core';<% if(routePath) { %>
import { ActivatedRoute, Params } from '@angular/router';<% } %><% if(standalone) {%>
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';<%} %>

@Component({
  selector: '<%= selector %>',
  templateUrl: './<%= dasherize(name) %>.page.html',
  styleUrls: ['./<%= dasherize(name) %>.page.<%= styleext %>'],<% if(standalone) {%>
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]<%} %>
})
export class <%= classify(name) %>Page implements OnInit {<% if(routePath) { %>

  params: Params;<% } %>

  constructor(<% if(routePath) { %>private route: ActivatedRoute<% } %>) { }

  ngOnInit() {<% if(routePath) { %>
    this.params = this.route.snapshot.params;<% } %>
  }

}
