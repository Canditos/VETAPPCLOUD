"use client";

import { useState } from "react";
import { Plus, Search, Phone, Mail, CreditCard, ChevronRight, ChevronLeft, PawPrint, MapPin, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PatientAvatar } from "@/components/PatientAvatar";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddCustomerForm } from "@/components/forms/AddCustomerForm";