const mongoose = require('mongoose');
const Swap = require('../models/swap');
const { ApiError } = require('../config/errors');



function normalizePair(u1, u2) 
{
  const [a, b] = [String(u1), String(u2)].sort();
  return { a, b };
}

exports.get = async (req, res, next) => 
{
  try 
  {
    const { with: peer, book } = req.query;

    if (!peer || !book) 
        throw ApiError.badRequest('Missing params');

    if (!mongoose.isValidObjectId(peer) || !mongoose.isValidObjectId(book))
      throw ApiError.badRequest('Invalid ids');

    const { a, b } = normalizePair(req.user.id, peer);

    const swap = await Swap.findOne({ book, userA: a, userB: b });

    if (!swap) 
        return res.json({ meConfirmed: false, otherConfirmed: false });

    const meIsA = String(req.user.id) === a;
    res.json({
      meConfirmed: meIsA ? swap.confirmA : swap.confirmB,
      otherConfirmed: meIsA ? swap.confirmB : swap.confirmA
    });
  } catch (e) { next(e); }
};

exports.toggle = async (req, res, next) => 
{
  try 
  {
    const { with: peer, book } = req.body;

    if (!peer || !book) 
        throw ApiError.badRequest('Missing params');

    if (!mongoose.isValidObjectId(peer) || !mongoose.isValidObjectId(book))
      throw ApiError.badRequest('Invalid ids');

    const { a, b } = normalizePair(req.user.id, peer);
    let swap = await Swap.findOne({ book, userA: a, userB: b });

    if (!swap) 
    {
      swap = await Swap.create({ book, userA: a, userB: b });
    }

    if (String(req.user.id) === a) 
    {
      swap.confirmA = !swap.confirmA;
    } else 
    {
      swap.confirmB = !swap.confirmB;
    }
    await swap.save();

    res.json({ ok: true });
  } catch (e) { next(e); }
};
