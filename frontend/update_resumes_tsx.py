import re

with open('src/pages/Resumes.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Change handleUpload
old_block = """
      try {
        await uploadResume(file, versionLabel || undefined);
        setIsUploadOpen(false);
        setFile(null);
        setVersionLabel('');
        fetchList();
      } catch (err: any) {
        setUploadError(err.detail || err.error || err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
      }
"""

new_block = """
      try {
        await uploadResume(file, versionLabel || undefined);
        setIsUploadOpen(false);
        setFile(null);
        setVersionLabel('');
      } catch (err: any) {
        setUploadError(err.detail || err.error || err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
        fetchList();
      }
"""

content = content.replace(old_block.strip(), new_block.strip())

with open('src/pages/Resumes.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Resumes.tsx")