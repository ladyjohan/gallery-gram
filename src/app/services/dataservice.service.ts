import { HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataserviceService {

  constructor(private http: HttpClient) { }

  apiUrl = "http://localhost/Gallery/api-gallery/";
  sendApiRequest(method:any, data:any) {
    return <any>(this.http.post(this.apiUrl + method, btoa(JSON.stringify(data))));
  }
  receiveApiRequest(method: any) {
    return this.http.get(this.apiUrl + method);
  }
  logout() {
    localStorage.removeItem("user_id"); // Clear stored session information
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    // You can clear other session data if needed
  }

}
