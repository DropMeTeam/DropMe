import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

function fileUrl(req, filename) {
  // serve /uploads as static
  const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${filename}`;
}

export async function getMyDriverRegistration(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).lean();
    if (!user) throw new HttpError(404, "User not found");
    res.json({ driverRegistration: user.driverRegistration || null, user: { id: user._id, role: user.role } });
  } catch (e) {
    next(e);
  }
}

export async function submitDriverRegistration(req, res, next) {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) throw new HttpError(404, "User not found");
    if (user.role !== "driver") throw new HttpError(403, "Only drivers can submit registration");

    const {
      nic,
      address,
      age,
      licenseNo,
      vehicleType,
      vehicleNumber,
      vehicleColor,
      seatsTotal,
    } = req.body;

    const licenseImg = req.files?.licenseImage?.[0];
    const vehicleImg = req.files?.vehiclePhoto?.[0];

    if (!nic || !address || !age || !licenseNo) throw new HttpError(400, "Missing driver details");
    if (!vehicleType || !vehicleNumber || !vehicleColor || !seatsTotal) throw new HttpError(400, "Missing vehicle details");

    user.driverRegistration.nic = String(nic).trim();
    user.driverRegistration.address = String(address).trim();
    user.driverRegistration.age = Number(age);
    user.driverRegistration.licenseNo = String(licenseNo).trim();

    if (licenseImg) user.driverRegistration.licenseImageUrl = fileUrl(req, licenseImg.filename);

    user.driverRegistration.vehicle = {
      type: vehicleType,
      number: String(vehicleNumber).trim(),
      color: String(vehicleColor).trim(),
      seatsTotal: Number(seatsTotal),
      photoUrl: vehicleImg ? fileUrl(req, vehicleImg.filename) : (user.driverRegistration.vehicle?.photoUrl || ""),
    };

    user.driverRegistration.status = "pending";
    user.driverRegistration.submittedAt = new Date();
    user.driverRegistration.reviewNote = "";
    user.driverRegistration.reviewedAt = null;
    user.driverRegistration.reviewedBy = null;

    await user.save();

    res.status(201).json({
      ok: true,
      driverRegistration: user.driverRegistration,
    });
  } catch (e) {
    next(e);
  }
}
