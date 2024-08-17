import { Component, HostListener } from '@angular/core';
import { DataserviceService } from '../services/dataservice.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {
  selectedFiles: File[] = [];
  fileSizeError: string | null = null;
  images: any[] = [];
  imagePreviews: string[] = [];
  error: string | undefined;
  selectedImage: any;
  lightboxImagePreviews: string[] = [];
  isImageLightboxOpen = false; // Lightbox for image viewing
  isUploadLightboxOpen = false; // Lightbox for image uploads
  showDropzoneLightbox = false; // Controls visibility of dropzone lightbox
  uploadIconVisible: boolean = false;
  showButtons = false;
  hoveredImages: boolean[] = [];
  isDragging: boolean = false;
  headerZIndex = 100;

  constructor(private dataService: DataserviceService, private http: HttpClient, private router: Router) {
    this.images.forEach(() => this.hoveredImages.push(false));
  }

  @HostListener('window:dragover', ['$event'])
  @HostListener('window:drop', ['$event'])
  preventDefault(event: Event) {
    event.preventDefault();
  }

  @HostListener('window:dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    if (event.target === document.body) {
      this.isDragging = false;
    }
  }

  @HostListener('window:dragenter', ['$event'])
  onDragEnter(event: DragEvent) {
    this.isDragging = true;
  }

  onFileSelected(event: any): void {
    this.handleFiles(event.target.files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  handleFiles(files: FileList): void {
    this.fileSizeError = null;
    this.uploadIconVisible = true;

    const newFiles = Array.from(files);

    // Filter out files that exceed the size limit
    const validFiles = newFiles.filter(file => file.size <= 20 * 1024 * 1024);
    const invalidFiles = newFiles.filter(file => file.size > 20 * 1024 * 1024);

    if (invalidFiles.length > 0) {
      this.fileSizeError = 'One or more files exceed 20 MB';
    }

    // Append valid files to the existing selectedFiles array
    this.selectedFiles = this.selectedFiles.concat(validFiles);

    // Generate previews for new valid files
    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  toggleHeaderZIndex(): void {
    this.headerZIndex = 0;
  }

  toggleButtons(index: number, hovered: boolean): void {
    this.hoveredImages[index] = hovered;
  }

  uploadFiles(): void {
    if (this.selectedFiles.length > 0) {
      const uploadPromises = this.selectedFiles.map(file => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const base64 = e.target.result.split(',')[1];
            const data = {
              fileName: file.name,
              fileType: file.type,
              fileContent: base64,
              userId: localStorage.getItem('user_id'),
              userName: localStorage.getItem('username')
            };
            this.dataService.sendApiRequest('uploadImage', data).subscribe(
              (response: any) => {
                if (response.code === 200) {
                  resolve();
                } else {
                  reject(response.message);
                }
              },
              (error: any) => {
                reject('Error uploading image');
              }
            );
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(uploadPromises)
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Upload Successful',
            text: 'All files have been uploaded successfully',
            backdrop: false  // Ensures the background remains unaffected
          });
          this.fetchImages();
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: error,
            backdrop: false  // Ensures the background remains unaffected
          });
        })
        .finally(() => {
          this.selectedFiles = [];
          this.uploadIconVisible = false;
          this.imagePreviews = [];  // Reset the previews after upload
        });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'No Files Selected',
        text: 'Please select files to upload.',
        backdrop: false  // Ensures the background remains unaffected
      });
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    if (this.selectedFiles.length === 0) {
      this.uploadIconVisible = false;
    }
  }

  removeAllSelectedFiles(): void {
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.uploadIconVisible = false;
  }

  ngOnInit(): void {
    this.fetchImages();
  }

  fetchImages(): void {
    this.dataService.receiveApiRequest('getImages').subscribe(
      (response: any) => {
        this.images = response;
      },
      (error) => {
        this.error = error.message || 'Failed to fetch images';
      }
    );
  }

  confirmDeleteImage(image_id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      backdrop: false  // Ensures the background remains unaffected
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteImage(image_id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Your image has been deleted.',
          backdrop: false  // Ensures the background remains unaffected
        });
      }
    });
  }

  deleteImage(image_id: string): void {
    this.dataService.sendApiRequest('deleteImage', { image_id: image_id }).subscribe(
      (response: any) => {
        this.fetchImages();
      },
      (error: any) => {
        console.error('Error deleting image', error);
      }
    );
  }

  downloadImage(imageFileName: string) {
    const imageUrl = `http://localhost/Gallery/api-gallery/uploads/${imageFileName}`;

    this.http.get(imageUrl, { responseType: 'blob' }).subscribe(
      (blob: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = imageFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      (error: any) => {
        console.error(`Error downloading the image ${imageFileName}: `, error);
      }
    );
  }

  downloadImageInLightbox(imageFileName: string) {
    const imageUrl = `http://localhost/Gallery/api-gallery/uploads/${imageFileName}`;

    this.http.get(imageUrl, { responseType: 'blob' }).subscribe(
      (blob: Blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = imageFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      (error: any) => {
        console.error(`Error downloading the image ${imageFileName}: `, error);
      }
    );
  }

  openImageLightbox(image: any): void {
    this.selectedImage = image;
    this.isImageLightboxOpen = true;
  }

  closeImageLightbox(): void {
    this.headerZIndex = 100;
    this.selectedImage = null;
    this.isImageLightboxOpen = false;
  }

  openUploadLightbox(): void {
    this.isUploadLightboxOpen = true;
  }

  closeUploadLightbox(): void {
    this.isUploadLightboxOpen = false;
  }

  handleUpdateImage(): void {
    this.fetchImages(); // Refresh images after update
  }

  handleDelete(image: any): void {
    this.confirmDeleteImage(image.id);
    this.closeImageLightbox();
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLElement;
    fileInput.click();
  }
  
  logout() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}
