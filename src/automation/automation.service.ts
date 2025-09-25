import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

export interface TriggerWorkflowPayload {
  name: string;
}

export interface TriggerWorkflowResponse {
  message: string;
}

@Injectable()
export class AutomationService {
  constructor(private readonly http: HttpService) {}

  async triggerWorkflow(
    payload: TriggerWorkflowPayload,
  ): Promise<TriggerWorkflowResponse> {
    const url = process.env.N8N_WEBHOOK_URL as string;

    const response$: Observable<AxiosResponse<TriggerWorkflowResponse>> =
      this.http.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

    const { data } = await lastValueFrom(response$);
    return data;
  }
}
