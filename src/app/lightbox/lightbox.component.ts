import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { DataserviceService } from '../services/dataservice.service';
import Swal from 'sweetalert2';

interface Comment {
  user_id: string;
  username: string;
  image_id: string;
  comment_text: string;
}

interface SelectedImage {
  file_name: string;
  username: string;
  image_id: string;
}

@Component({
  selector: 'app-lightbox',
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss']
})
export class LightboxComponent {
  @Input()
  selectedImage!: SelectedImage;
  @Output() updateImageEvent = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<any>();
  @Output() download = new EventEmitter<string>();

  filterSettings: any = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0
  };

  showEditOptions = false;

  @ViewChild('imageElement') imageElement: ElementRef | undefined;

  comments: Comment[] = [];
  newComment: string = '';

  originalFilterSettings: any = {};

  constructor(private elementRef: ElementRef, private dataService: DataserviceService) {
    this.fetchComments();
    this.storeOriginalFilterSettings();
  }

  storeOriginalFilterSettings() {
    this.originalFilterSettings = { ...this.filterSettings };
  }

  closeLightbox(): void {
    this.close.emit();
  }

  deleteImage(): void {
    this.delete.emit(this.selectedImage);
  }

  onDownload(imageFileName: string) {
    this.download.emit(imageFileName);
  }

  applyFilter(filterType: string, value: number): void {
    this.filterSettings[filterType] = value;
    this.applyFilters();
  }

  resetFilters(): void {
    if (JSON.stringify(this.filterSettings) === JSON.stringify(this.originalFilterSettings)) {
      Swal.fire('No Changes', 'There are no changes to reset.', 'info');
    } else {
      this.filterSettings.brightness = 100;
      this.filterSettings.contrast = 100;
      this.filterSettings.saturate = 100;
      this.filterSettings.grayscale = 0;
      this.filterSettings.sepia = 0;
      this.filterSettings.blur = 0;

      this.applyFilters();
      Swal.fire('Reset', 'Filters have been reset.', 'success');
    }
  }

  resetFiltersSilently(): void {
    if (JSON.stringify(this.filterSettings) === JSON.stringify(this.originalFilterSettings)) {
      // No alert here, just return
      return;
    } else {
      this.filterSettings.brightness = 100;
      this.filterSettings.contrast = 100;
      this.filterSettings.saturate = 100;
      this.filterSettings.grayscale = 0;
      this.filterSettings.sepia = 0;
      this.filterSettings.blur = 0;

      this.applyFilters();
      Swal.fire('Reset', 'Filters have been reset.', 'success');
    }
  }

  updateImage(): void {
    if (JSON.stringify(this.filterSettings) === JSON.stringify(this.originalFilterSettings)) {
      Swal.fire('No Changes', 'There are no changes to save.', 'info');
      return;
    }
  
    const imageElement = document.createElement('img');
    imageElement.crossOrigin = 'Anonymous';
    imageElement.src = 'http://localhost/Gallery/api-gallery/uploads/' + this.selectedImage.file_name;
    imageElement.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
  
      if (ctx !== null) {
        ctx.filter = `brightness(${this.filterSettings.brightness}%) ` +
                     `contrast(${this.filterSettings.contrast}%) ` +
                     `saturate(${this.filterSettings.saturate}%) ` +
                     `grayscale(${this.filterSettings.grayscale}%) ` +
                     `sepia(${this.filterSettings.sepia}%) ` +
                     `blur(${this.filterSettings.blur}px)`;
  
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
  
        const dataURL = canvas.toDataURL('image/png');
        const base64Image = dataURL.split(',')[1];
        const updatedImage = {
          userId: localStorage.getItem('user_id'),
          userName: localStorage.getItem('username'),
          fileContent: base64Image,
          fileName: this.selectedImage.file_name,
          fileType: 'image/png'
        };
  
        this.dataService.sendApiRequest('uploadImage', updatedImage).subscribe((response: any) => {
          if (response.code === 200) {
            Swal.fire({
              title: 'Saved',
              text: 'Image has been updated successfully.',
              icon: 'success',
              didClose: () => {
                location.reload();
              }
            });
            this.storeOriginalFilterSettings();
          } else {
            Swal.fire('Error', 'Error updating image: ' + response.message, 'error');
          }
        });
      } else {
        console.error('Canvas context is null.');
      }
    };
  }
  

  fetchComments(): void {
    this.dataService.receiveApiRequest('getComments').subscribe(
      (response: any) => {
        this.comments = response;
      },
      (error: any) => {
        console.error('Error fetching comments:', error);
      }
    );
  }

  addComment(): void {
    if (this.newComment.trim() !== '') {
      const userId = localStorage.getItem('user_id');
      const userName = localStorage.getItem('username');
      if (!userId) {
        console.error('User ID not found in localStorage.');
        return;
      }

      const imageId = this.selectedImage.image_id;
      const commentData = {
        user_id: userId,
        username: userName,
        image_id: imageId,
        comment_text: this.newComment.trim()
      };

      this.dataService.sendApiRequest('addComment', commentData).subscribe((response: any) => {
        if (response.code === 200) {
          this.fetchComments();
          this.comments.push(response.comment);
          this.newComment = '';
        } else {
          console.error('Error adding comment:', response.message);
        }
      });
    }
  }

  toggleEditOptions(): void {
    this.showEditOptions = !this.showEditOptions;
    if (!this.showEditOptions) {
      this.resetFiltersSilently();
    }
  }

  private applyFilters(): void {
    let filterString = '';
    for (const key in this.filterSettings) {
      if (Object.prototype.hasOwnProperty.call(this.filterSettings, key)) {
        filterString += `${key}(${this.filterSettings[key]}%) `;
      }
    }
    if (this.imageElement) {
      this.imageElement.nativeElement.style.filter = filterString.trim();
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  goBack(): void {
    this.closeLightbox();
  }

  refreshSelectedImage(): void {
    this.selectedImage.file_name += '?t=' + new Date().getTime();
  }
}
