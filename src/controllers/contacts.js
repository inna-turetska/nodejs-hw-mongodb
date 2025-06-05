import * as fs from 'node:fs/promises';
import path from 'node:path';

import createHttpError from 'http-errors';
import {
  getAllContacts,
  getContactById,
  createContact,
  patchContact,
  deleteContact,
} from '../services/contacts.js';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);

  const contacts = await getAllContacts({
    userId: req.user._id,
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts',
    data: contacts,
  });
};

export const getContactsByIdController = async (req, res) => {
  const { contactId } = req.params;
  const userId = req.user._id;
  const contact = await getContactById({ contactId, userId });

  if (!contact) {
    throw createHttpError(404, 'Contact not found!');
  }

  res.json({
    status: 200,
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  const userId = req.user._id;
  let photo = null;

  if (getEnvVar('UPLOAD_TO_CLOUDINARY') === 'true') {
    const result = await saveFileToCloudinary(req.file.path);
    await fs.unlink(req.file.path);

    photo = result.secure_url;
  } else {
    await fs.rename(
      req.file.path,
      path.resolve('src', 'uploads', 'photos', req.file.filename),
    );
    photo = `http://localhost:3000/photos/${req.file.filename}`;
  }
  const contact = await createContact({ ...req.body, userId, photo });

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

export const patchContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const userId = req.user._id;
  let photo = null;

  if (getEnvVar('UPLOAD_TO_CLOUDINARY') === 'true') {
    const result = await saveFileToCloudinary(req.file.path);
    await fs.unlink(req.file.path);

    photo = result.secure_url;
  } else {
    await fs.rename(
      req.file.path,
      path.resolve('src', 'uploads', 'photos', req.file.filename),
    );
    photo = `http://localhost:3000/photos/${req.file.filename}`;
  }

  const updateData = { ...req.body };
  if (photo !== null) {
    updateData.photo = photo;
  }
  const result = await patchContact(contactId, userId, updateData);
  if (!result) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }
  res.json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: result.contact,
  });
};

export const deleteContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const userId = req.user._id;
  const contact = await deleteContact(contactId, userId);

  if (!contact) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }
  res.status(204).send();
};
