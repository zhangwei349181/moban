/**
 * Footer 邮箱订阅：metadata + 模板字段（服务端）
 */

import { APP_CONFIG } from '../../../config/app';
import { fetchWebComponent } from '../../../lib/webComponent';
import { loadFormSectionViewModel, type FormFieldView } from '../../../lib/formSection';
import {
  resolveSubscribeSectionMeta,
  type SubscribeSectionMeta,
} from './resolvers/subscribe';

export type { SubscribeSectionMeta };

export type SubscribeFormStatus = 'pending' | 'ready';

export interface SubscribeViewModel {
  status: SubscribeFormStatus;
  meta: SubscribeSectionMeta;
  fields: FormFieldView[];
}

export async function loadSubscribeViewModel(
  locale: string,
  tenantId: string = APP_CONFIG.tenantId
): Promise<SubscribeViewModel> {
  const component = await fetchWebComponent('subscribe', tenantId);
  const meta = resolveSubscribeSectionMeta(component?.metadata, locale);

  const formVm = await loadFormSectionViewModel(
    {
      templateId: meta.templateId,
      formType: meta.formType,
      title: '',
      subtitle: '',
      submitLabel: meta.buttonText,
    },
    locale,
    tenantId
  );

  return {
    status: formVm.status,
    meta,
    fields: formVm.fields,
  };
}
