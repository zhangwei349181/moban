/**
 * Dashboard 编辑资料（侧栏头像 + modal）
 */

import { getCurrentMembershipId, getAuthTenantId, updateProfile, getUser, type UpdateProfileRequest } from './auth';
import { clientProduct } from './product';
import { clientFileUpload } from './fileUpload';
import { clientTranslations } from './translations';
import { openDashboardModal, closeDashboardModal } from './dashboardModal.client';
import { getDashboardRoot, getPanelRoot } from './dashboardPanelUtils.client';

let currentProfile: Awaited<ReturnType<typeof clientProduct.fetchUserProfile>> | null = null;
let shouldRemoveAvatar = false;
let localAvatarPreviewUrl: string | null = null;

function revokeLocalAvatarPreview() {
  if (localAvatarPreviewUrl) {
    URL.revokeObjectURL(localAvatarPreviewUrl);
    localAvatarPreviewUrl = null;
  }
}

function getProfileMessageEls(root: HTMLElement) {
  return {
    errorEl: root.querySelector('[data-dashboard-profile-error]') as HTMLElement | null,
    successEl: root.querySelector('[data-dashboard-profile-success]') as HTMLElement | null,
  };
}

function hideProfileMessages(root: HTMLElement) {
  const { errorEl, successEl } = getProfileMessageEls(root);
  errorEl?.classList.add('dashboard-section__hidden');
  successEl?.classList.add('dashboard-section__hidden');
}

function showProfileError(root: HTMLElement, message: string) {
  const { errorEl, successEl } = getProfileMessageEls(root);
  successEl?.classList.add('dashboard-section__hidden');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('dashboard-section__hidden');
  }
}

function showProfileSuccess(root: HTMLElement, message: string) {
  const { errorEl, successEl } = getProfileMessageEls(root);
  errorEl?.classList.add('dashboard-section__hidden');
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.remove('dashboard-section__hidden');
  }
}

function setAvatarPreview(root: HTMLElement, imageUrl: string, fallbackText: string) {
  const preview = root.querySelector('[data-dashboard-avatar-preview]') as HTMLElement | null;
  if (!preview) return;

  if (imageUrl) {
    preview.style.backgroundImage = `url(${imageUrl})`;
    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
    preview.textContent = '';
    preview.classList.add('dashboard-profile-form__preview--image');
  } else {
    preview.style.backgroundImage = '';
    preview.textContent = fallbackText;
    preview.classList.remove('dashboard-profile-form__preview--image');
  }
}

function setProfileSaving(root: HTMLElement, saving: boolean) {
  const saveBtn = root.querySelector('[data-dashboard-profile-save]') as HTMLButtonElement | null;
  const uploadBtn = root.querySelector('[data-dashboard-avatar-upload-btn]') as HTMLButtonElement | null;
  const removeBtn = root.querySelector('[data-dashboard-avatar-remove]') as HTMLButtonElement | null;

  if (saveBtn) {
    if (saving) {
      if (!saveBtn.dataset.originalText) {
        saveBtn.dataset.originalText = saveBtn.textContent || '';
      }
      saveBtn.textContent = clientTranslations.get('saving_changes');
      saveBtn.disabled = true;
    } else {
      saveBtn.disabled = false;
      if (saveBtn.dataset.originalText) {
        saveBtn.textContent = saveBtn.dataset.originalText;
      }
    }
  }

  if (uploadBtn) uploadBtn.disabled = saving;
  if (removeBtn) removeBtn.disabled = saving;
}

async function loadProfileData() {
  const membershipId = getCurrentMembershipId();
  const tenantId = getAuthTenantId();
  if (!membershipId || !tenantId) return null;
  currentProfile = await clientProduct.fetchUserProfile(membershipId, tenantId);
  return currentProfile;
}

function fillProfileForm(root: HTMLElement) {
  const user = currentProfile?.data?.user;
  if (!user) return;

  (root.querySelector('[name="display_name"]') as HTMLInputElement).value = user.display_name || '';
  (root.querySelector('[name="first_name"]') as HTMLInputElement).value = user.first_name || '';
  (root.querySelector('[name="last_name"]') as HTMLInputElement).value = user.last_name || '';
  (root.querySelector('[name="email"]') as HTMLInputElement).value = user.email || '';
  (root.querySelector('[name="phone"]') as HTMLInputElement).value = user.phone || '';

  const fallback = (user.display_name || user.email || 'U').slice(0, 2).toUpperCase();
  setAvatarPreview(root, user.avatar_url || '', fallback);
}

function resetAvatarFileInput(root: HTMLElement) {
  const fileInput = root.querySelector('[data-dashboard-avatar-upload]') as HTMLInputElement | null;
  if (fileInput) fileInput.value = '';
}

function handleAvatarFileSelected(root: HTMLElement, file: File) {
  if (!file.type.startsWith('image/')) {
    showProfileError(root, clientTranslations.get('only_image_files_allowed'));
    resetAvatarFileInput(root);
    return;
  }

  shouldRemoveAvatar = false;
  revokeLocalAvatarPreview();
  localAvatarPreviewUrl = URL.createObjectURL(file);
  setAvatarPreview(root, localAvatarPreviewUrl, 'U');
  showProfileSuccess(root, clientTranslations.get('avatar_selected_click_save'));
}

async function openEditProfile() {
  const modalRoot =
    getDashboardRoot()?.querySelector('[data-dashboard-modal="edit-profile"]') ||
    document.querySelector('[data-dashboard-modal="edit-profile"]');
  if (!(modalRoot instanceof HTMLElement)) return;

  const sectionRoot = modalRoot.closest('[data-dashboard-section]') || document.body;
  revokeLocalAvatarPreview();
  shouldRemoveAvatar = false;
  resetAvatarFileInput(modalRoot);
  hideProfileMessages(modalRoot);
  setProfileSaving(modalRoot, false);

  await loadProfileData();
  fillProfileForm(modalRoot);
  openDashboardModal(sectionRoot as HTMLElement, 'edit-profile');
}

async function saveProfile(root: HTMLElement) {
  if (!currentProfile?.data?.user) return;

  hideProfileMessages(root);
  setProfileSaving(root, true);

  const updates: UpdateProfileRequest = {};
  const user = currentProfile.data.user;

  const displayName = (root.querySelector('[name="display_name"]') as HTMLInputElement).value.trim();
  const firstName = (root.querySelector('[name="first_name"]') as HTMLInputElement).value.trim();
  const lastName = (root.querySelector('[name="last_name"]') as HTMLInputElement).value.trim();
  const email = (root.querySelector('[name="email"]') as HTMLInputElement).value.trim();
  const phone = (root.querySelector('[name="phone"]') as HTMLInputElement).value.trim();

  if (displayName !== (user.display_name || '')) updates.display_name = displayName;
  if (firstName !== (user.first_name || '')) updates.first_name = firstName;
  if (lastName !== (user.last_name || '')) updates.last_name = lastName;
  if (email !== (user.email || '')) updates.email = email;
  if (phone !== (user.phone || '')) updates.phone = phone;

  const fileInput = root.querySelector('[data-dashboard-avatar-upload]') as HTMLInputElement | null;

  try {
    if (shouldRemoveAvatar) {
      updates.avatar_url = '';
    } else if (fileInput?.files?.[0]) {
      showProfileSuccess(root, clientTranslations.get('uploading_avatar'));
      const uploaded = await clientFileUpload.uploadFile(fileInput.files[0]);
      updates.avatar_url = uploaded.url;
    }

    if (Object.keys(updates).length === 0) {
      setProfileSaving(root, false);
      return;
    }

    const result = await updateProfile(updates);
    revokeLocalAvatarPreview();
    resetAvatarFileInput(root);
    shouldRemoveAvatar = false;

    const updatedUser = result.data?.user;
    if (updatedUser && currentProfile.data.user) {
      Object.assign(currentProfile.data.user, updatedUser);
    }

    showProfileSuccess(root, clientTranslations.get('profile_updated_successfully'));
    window.dispatchEvent(
      new CustomEvent('profile-updated', { detail: { user: updatedUser || getUser() } })
    );

    setTimeout(() => {
      const sectionRoot = root.closest('[data-dashboard-section]') || document.body;
      closeDashboardModal(sectionRoot as HTMLElement, 'edit-profile');
    }, 1200);
  } catch (err) {
    const isAvatarUpload = Boolean(fileInput?.files?.[0] && !shouldRemoveAvatar);
    const fallbackKey = isAvatarUpload ? 'failed_to_upload_avatar' : 'failed_to_update_profile';
    const message =
      err instanceof Error ? err.message : clientTranslations.get(fallbackKey);
    showProfileError(root, message);
  } finally {
    setProfileSaving(root, false);
  }
}

function bindProfileModal(root: HTMLElement) {
  if (root.dataset.dashboardProfileBound === '1') return;
  root.dataset.dashboardProfileBound = '1';

  root.querySelector('[data-dashboard-profile-save]')?.addEventListener('click', () => {
    void saveProfile(root);
  });

  root.querySelector('[data-dashboard-avatar-upload-btn]')?.addEventListener('click', () => {
    (root.querySelector('[data-dashboard-avatar-upload]') as HTMLInputElement)?.click();
  });

  root.querySelector('[data-dashboard-avatar-upload]')?.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    handleAvatarFileSelected(root, file);
  });

  root.querySelector('[data-dashboard-avatar-remove]')?.addEventListener('click', () => {
    shouldRemoveAvatar = true;
    revokeLocalAvatarPreview();
    resetAvatarFileInput(root);

    const user = currentProfile?.data?.user;
    const fallback = (user?.display_name || user?.email || 'U').slice(0, 2).toUpperCase();
    setAvatarPreview(root, '', fallback);
    showProfileSuccess(root, clientTranslations.get('avatar_removed_click_save'));
  });
}

export function initDashboardProfilePanel(): void {
  const modal = document.querySelector('[data-dashboard-modal="edit-profile"]') as HTMLElement | null;
  if (modal) bindProfileModal(modal);

  const profilePanel = getPanelRoot('profile');
  if (profilePanel) bindProfileModal(profilePanel);

  (window as any).openDashboardEditProfile = openEditProfile;
}
