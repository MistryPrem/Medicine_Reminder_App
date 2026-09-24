import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { MedicationDose } from '../src/models/MedicationDose.js';
import { CaregiverRelationship } from '../src/models/CaregiverRelationship.js';
import { generateAccessToken } from '../src/services/authService.js';

describe('Adherence Analytics Endpoints', () => {
  let caregiverId;
  let elderlyId;
  let caregiverToken;
  let elderlyToken;

  beforeEach(() => {
    caregiverId = new mongoose.Types.ObjectId();
    elderlyId = new mongoose.Types.ObjectId();

    caregiverToken = generateAccessToken({
      _id: caregiverId.toString(),
      email: 'caregiver@example.com',
      role: 'caregiver'
    });

    elderlyToken = generateAccessToken({
      _id: elderlyId.toString(),
      email: 'elderly@example.com',
      role: 'elderly'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/analytics/elderly/:elderlyId/adherence', () => {
    it('returns calculated adherence rates and breakdown for authorized caregiver', async () => {
      // Mock relationship verification
      jest.spyOn(CaregiverRelationship, 'findOne').mockResolvedValue({
        caregiverId,
        elderlyId,
        status: 'active',
        permissions: 'full'
      });

      // Mock user existence (handles both authMiddleware for caregiver and service lookup for elderly)
      jest.spyOn(User, 'findById').mockImplementation(async (id) => {
        if (id.toString() === caregiverId.toString()) {
          return {
            _id: caregiverId,
            fullName: 'Jane Caregiver',
            role: 'caregiver',
            isActive: true
          };
        }
        return {
          _id: elderlyId,
          fullName: 'Grandma Mary',
          role: 'elderly',
          timezone: 'UTC',
          isActive: true
        };
      });

      const now = new Date();
      const mockDoses = [
        {
          _id: new mongoose.Types.ObjectId(),
          elderlyId,
          scheduledFor: new Date(now.getTime() - 2 * 3600 * 1000),
          status: 'taken',
          medicationId: { name: 'Aspirin', dosage: '81mg', dosageUnit: 'mg' }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          elderlyId,
          scheduledFor: new Date(now.getTime() - 1 * 3600 * 1000),
          status: 'missed',
          medicationId: { name: 'Metformin', dosage: '500mg', dosageUnit: 'mg' }
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockDoses)
      };

      jest.spyOn(MedicationDose, 'find').mockReturnValue(mockQuery);

      const res = await request(app)
        .get(`/api/v1/analytics/elderly/${elderlyId}/adherence?days=7`)
        .set('Authorization', `Bearer ${caregiverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallAdherenceRate).toBe(50); // 1 taken out of 2 finished
      expect(res.body.data.counts.taken).toBe(1);
      expect(res.body.data.counts.missed).toBe(1);
      expect(Array.isArray(res.body.data.dailyBreakdown)).toBe(true);
    });
  });
});
